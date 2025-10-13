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

[System.Serializable]
public class WordListWrapper
{
    public List<WordData> words;
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

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    private static void InitializeOnLoad()
    {
        if (Instance == null)
        {
            GameObject obj = new GameObject("WordManager");
            Instance = obj.AddComponent<WordManager>();
            DontDestroyOnLoad(obj);
        }
    }

    private void Awake()
    {
        if (Instance == null)
        {
            Debug.Log("WORD MANAGER INIT");
            Instance = this;
            DontDestroyOnLoad(gameObject);
            LoadWordsDB();
        }
        else if (Instance != this)
        {
            Destroy(gameObject);
            return;
        }
    }

    private void LoadDB(string jsonData)
    {
        WordListWrapper wrapper = JsonUtility.FromJson<WordListWrapper>(jsonData);
        if (wrapper == null || wrapper.words == null)
        {
            Debug.LogError("Failed to parse word JSON!");
            return;
        }

        wordDB.Clear();

        foreach (WordData data in wrapper.words)
        {
            WordItem newItem = new WordItem
            {
                eng_word = data.eng_word,
                slo_word = data.slo_word,
                imageFile = data.image
            };

            string imagePath = "WordImages/" + Path.GetFileNameWithoutExtension(data.image);
            Sprite loadedSprite = Resources.Load<Sprite>(imagePath);

            if (loadedSprite != null)
            {
                newItem.image = loadedSprite;
            }
            else
            {
                Debug.LogWarning($"Could not load image: {imagePath}");
            }

            wordDB.Add(newItem);
        }

        Debug.Log($"Successfully loaded {wordDB.Count} words from JSON");
    }

    private void LoadWordsDB()
    {
        TextAsset jsonTextAsset = Resources.Load<TextAsset>("WordDBs/words");
    
        if (jsonTextAsset != null)
        {
            string jsonData = jsonTextAsset.text;
            LoadDB(jsonData);
        }
        else
        {
            Debug.LogError("Failed to load words.json from Resources.");
        }
    }

}
