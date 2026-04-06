using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System;

[Serializable]
public class VerificationData
{
    public string key;
}

[Serializable]
public class VerificationResponse
{
    public bool valid;
    public string status;
    public string message;
}

public class PremiumManager : MonoBehaviour
{
    private string backendUrl = "http://localhost:5000/api/verify-key";

    public void VerifyKey(string enteredKey)
    {
        StartCoroutine(SendVerificationRequest(enteredKey));
    }

    private IEnumerator SendVerificationRequest(string key)
    {
        VerificationData data = new VerificationData { key = key };
        string jsonData = JsonUtility.ToJson(data);

        using (UnityWebRequest request = new UnityWebRequest(backendUrl, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error: " + request.error);
            }
            else
            {
                VerificationResponse response = JsonUtility.FromJson<VerificationResponse>(request.downloadHandler.text);
                if (response.valid)
                {
                    Debug.Log("Premium Activated! Status: " + response.status);
                    // TODO: Unlock premium features in your game here!
                }
                else
                {
                    Debug.Log("Invalid Key: " + response.message);
                }
            }
        }
    }
}
