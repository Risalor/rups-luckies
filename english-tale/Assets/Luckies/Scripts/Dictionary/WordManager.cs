using UnityEngine;
using System.Collections.Generic;
using System.IO;

[System.Serializable]
public class WordData
{
    public string image;
    public string eng_word;
    public string slo_word;
}

public class WordManager : MonoBehaviour
{
    public static WordManager Instance { get; private set; }

    [System.Serializable]
    public class WordItem
    {
        public string eng_word;
        public string slo_word;
        public Sprite image;
        public string imageFile;
    }

    public List<WordItem> wordDB = new List<WordItem>();
    private void Awaken()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
    }

    private void LoadDB(string jsonData)
    {
        List<WordData> wordDataList = JsonUtility.FromJson<List<WordData>>(jsonData);

        wordDB.Clear();

        foreach (WordData data in wordDataList)
        {
            WordItem newItem = new WordItem
            {
                eng_word = data.eng_word,
                slo_word = data.slo_word,
                imageFile = data.image
            };
                
            string imagePath = "Images/" + Path.GetFileNameWithoutExtension(data.image);
            Sprite loadedSprite = Resources.Load<Sprite>(imagePath);
                
            if (loadedSprite != null)
            {
                    newItem.image = loadedSprite;
            } else
            {
                Debug.LogWarning($"Could not load image: {imagePath}");
            }
                
            wordDB.Add(newItem);
        }
            
        Debug.Log($"Successfully loaded {wordDB.Count} words from JSON");
    }

    private void LoadWordsDB()
    {
        string filePath = Path.Combine(Application.streamingAssetsPath, "words.json");
        if (File.Exists(filePath))
        {
            string jsonData = File.ReadAllText(filePath);
            LoadDB(jsonData);
            return;
        }
    }

}
