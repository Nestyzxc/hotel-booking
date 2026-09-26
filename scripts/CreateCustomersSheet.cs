using System;
using System.IO;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

class Program
{
    static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    static void Main(string[] args)
    {
        string saPath = args[0];
        string ssId = args[1];

        var sa = JsonDocument.Parse(File.ReadAllText(saPath)).RootElement;
        string clientEmail = sa.GetProperty("client_email").GetString();
        string privateKeyPem = sa.GetProperty("private_key").GetString();
        string tokenUri = sa.GetProperty("token_uri").GetString();

        // 1) Build JWT
        long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        long exp = now + 3600;

        string header = "{\"alg\":\"RS256\",\"typ\":\"JWT\"}";
        string claimSet = "{\"iss\":\"" + clientEmail + "\",\"scope\":\"https://www.googleapis.com/auth/spreadsheets\",\"aud\":\"" + tokenUri + "\",\"exp\":" + exp + ",\"iat\":" + now + "}";

        string headerB64 = Base64UrlEncode(Encoding.UTF8.GetBytes(header));
        string claimB64 = Base64UrlEncode(Encoding.UTF8.GetBytes(claimSet));
        string signingInput = headerB64 + "." + claimB64;

        // Import PKCS#8 PEM
        var rsa = RSA.Create();
        rsa.ImportFromPem(privateKeyPem.ToCharArray());

        byte[] signature = rsa.SignData(Encoding.UTF8.GetBytes(signingInput), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        string sigB64 = Base64UrlEncode(signature);
        string jwt = signingInput + "." + sigB64;

        // 2) Get access token
        var tokenBody = "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt;
        using var client = new HttpClient();
        var tokenResp = client.PostAsync(tokenUri, new StringContent(tokenBody, Encoding.UTF8, "application/x-www-form-urlencoded")).GetAwaiter().GetResult();
        var tokenDoc = JsonDocument.Parse(tokenResp.Content.ReadAsStringAsync().GetAwaiter().GetResult());
        string accessToken = tokenDoc.RootElement.GetProperty("access_token").GetString();
        Console.WriteLine("Got access token");

        // 3) Add Customers sheet
        string addBody = "{\"requests\":[{\"addSheet\":{\"properties\":{\"title\":\"Customers\",\"gridProperties\":{\"rowCount\":1000,\"columnCount\":12}}}}]}";
        var addReq = new HttpRequestMessage(HttpMethod.Post, "https://sheets.googleapis.com/v4/spreadsheets/" + ssId + ":batchUpdate");
        addReq.Headers.Add("Authorization", "Bearer " + accessToken);
        addReq.Content = new StringContent(addBody, Encoding.UTF8, "application/json");
        var addResp = client.SendAsync(addReq).GetAwaiter().GetResult();
        string addText = addResp.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        Console.WriteLine("Add response: " + addText);
        using var addDoc = JsonDocument.Parse(addText);
        long sheetId = addDoc.RootElement.GetProperty("replies")[0].GetProperty("addSheet").GetProperty("properties").GetProperty("sheetId").GetInt64();

        // 4) Write header
        string[] headers = new[] {
            "line_user_id", "first_seen_at", "last_seen_at", "full_name", "phone", "email",
            "total_stays", "total_nights", "lifetime_value", "last_preference_tags",
            "marketing_opt_out", "notes"
        };
        var headersJson = JsonSerializer.Serialize(new[] { headers });
        string valuesJson = "{\"values\":" + headersJson + "}";
        string range = "Customers!A1:L1";
        var updateReq = new HttpRequestMessage(HttpMethod.Put, "https://sheets.googleapis.com/v4/spreadsheets/" + ssId + "/values/" + range + "?valueInputOption=RAW");
        updateReq.Headers.Add("Authorization", "Bearer " + accessToken);
        updateReq.Content = new StringContent(valuesJson, Encoding.UTF8, "application/json");
        var updateResp = client.SendAsync(updateReq).GetAwaiter().GetResult();
        Console.WriteLine("Update response: " + updateResp.Content.ReadAsStringAsync().GetAwaiter().GetResult());

        // 5) Format: freeze + bold
        string fmtBody = "{\"requests\":[" +
            "{\"updateSheetProperties\":{\"properties\":{\"sheetId\":" + sheetId + ",\"gridProperties\":{\"frozenRowCount\":1}},\"fields\":\"gridProperties.frozenRowCount\"}}," +
            "{\"repeatCell\":{\"range\":{\"sheetId\":" + sheetId + ",\"startRowIndex\":0,\"endRowIndex\":1},\"cell\":{\"userEnteredFormat\":{\"textFormat\":{\"bold\":true},\"backgroundColor\":{\"red\":0.95,\"green\":0.95,\"blue\":0.95}}},\"fields\":\"userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColor\"}}" +
            "]}";
        var fmtReq = new HttpRequestMessage(HttpMethod.Post, "https://sheets.googleapis.com/v4/spreadsheets/" + ssId + ":batchUpdate");
        fmtReq.Headers.Add("Authorization", "Bearer " + accessToken);
        fmtReq.Content = new StringContent(fmtBody, Encoding.UTF8, "application/json");
        var fmtResp = client.SendAsync(fmtReq).GetAwaiter().GetResult();
        Console.WriteLine("Format response: " + fmtResp.StatusCode);

        Console.WriteLine("=== DONE ===");
        Console.WriteLine("Sheet: Customers, gid=" + sheetId);
    }
}
