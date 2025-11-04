using UnityEngine;

public class Dictionary : UIObject
{
    public static Dictionary Instance;
    public GameObject Dict;
    public DictionaryEntry entryPrefab;
    public Transform content;
    public AudioClip OpenSound;
    private AudioSource audioSource;
    private Animator anim = null;
    private bool DictToggle = true;

    public void Awake()
    {
        this.SetupSingleton(ref Instance);

        gameObject.SetActive(true);

        anim = Dict.GetComponent<Animator>();
        audioSource = Dict.GetComponent<AudioSource>();
    }

    private void Start()
    {
        foreach (var child in content.GetComponentsInChildren<DictionaryEntry>())
            Destroy(child.gameObject);

        foreach (var word in WordManager.Instance.wordDB)
            Instantiate(entryPrefab, content).Setup(word);
    }
    
    public void OnDictionaryToggle()
    {
        if (anim == null)
        {
            anim = Dict.GetComponent<Animator>();
        }
        
        if(audioSource == null)
        {
            audioSource = Dict.GetComponent<AudioSource>();
        }

        if (DictToggle)
        {
            anim.SetBool("SlideIn", true);
            anim.SetBool("SlideOut", false);
            Debug.Log("Open!");
        }
        else
        {
            anim.SetBool("SlideIn", false);
            anim.SetBool("SlideOut", true);
        }

        audioSource.clip = OpenSound;
        audioSource.Play();

        DictToggle = !DictToggle;
    }
}
