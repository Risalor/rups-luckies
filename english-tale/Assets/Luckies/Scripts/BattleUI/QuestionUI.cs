using UnityEngine;
using TMPro;
using UnityEngine.UI;

public class QuestionUI : MonoBehaviour
{
    public TMP_Text questionText;
    public TMP_Text feedbackText;
    public TMP_InputField answerInput;
    public Button submitButton;
    public Button nextButton;
    public Image wordImage;

    public WordItem currentWord;

    private void Start()
    {
        feedbackText.gameObject.SetActive(false);
        nextButton.gameObject.SetActive(false);

        submitButton.onClick.AddListener(CheckAnswer);
        nextButton.onClick.AddListener(LoadNewWord);

        LoadNewWord();
    }

    private void LoadNewWord()
    {
        currentWord = WordManager.Instance.getRandomWord();

        if (currentWord == null)
        {
            questionText.text = "No words available!";
            return;
        }

        questionText.text = "Translate: " + currentWord.slo_word;
        answerInput.text = "";
        feedbackText.gameObject.SetActive(false);
        submitButton.gameObject.SetActive(true);
        nextButton.gameObject.SetActive(false);

        if (wordImage != null)
            wordImage.sprite = currentWord.image;
    }


    private void CheckAnswer()
    {
        string playerAnswer = answerInput.text.ToLower().Trim();
        string correctAnswer = currentWord.eng_word.ToLower().Trim();

        feedbackText.text = (playerAnswer == correctAnswer)
            ? "Correct!"
            : "Nope! It’s: " + currentWord.eng_word;

        feedbackText.gameObject.SetActive(true);
        submitButton.gameObject.SetActive(false);
        nextButton.gameObject.SetActive(true);
    }
}
