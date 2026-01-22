using System.Collections;
using UnityEngine;
using Vuplex.WebView;

public class LogicGateMinigame : MonoBehaviour
{
    [SerializeField]
    private CanvasWebViewPrefab _webViewPrefab = null;

    private bool _isInitialized = false;
    private QuestionUI _questionUI;

    public void Setup(QuestionUI questionUI)
    {
        _questionUI = questionUI;

        gameObject.SetActive(true);
    }

    public void Hide()
    {
        gameObject.SetActive(false);
    }

    private void OnEnable()
    {
        StartCoroutine(WaitForWebView());
    }

    private void OnDisable()
    {
        if (_isInitialized)
        {
            _webViewPrefab.WebView.ConsoleMessageLogged -= OnConsoleMessageLogged;
            _isInitialized = false;
        }
    }

    private IEnumerator WaitForWebView()
    {
        while (_webViewPrefab.WebView == null)
            yield return null;

        _webViewPrefab.WebView.LoadUrl("http://127.0.0.1:5173/?scene=logic");
        _webViewPrefab.WebView.ConsoleMessageLogged += OnConsoleMessageLogged;
        _isInitialized = true;
    }

    void OnConsoleMessageLogged(object sender, ConsoleMessageEventArgs eventArgs)
    {
        if (!_questionUI)
            return;

        if (eventArgs.Message == "FAIL")
            _questionUI.LogicGateMinigameResult(false);
        else if (eventArgs.Message == "SUCCESS")
            _questionUI.LogicGateMinigameResult(true);
    }
}
