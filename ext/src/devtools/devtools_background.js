var category = chrome.devtools.audits.addCategory("Readability", 2);
  category.onAuditStarted.addListener(function(results) {
    var details = results.createResult("Details...");
    var styles = details.addChild("2 styles with small font");
    var elements = details.addChild("3 elements with small font");
  
    results.addResult("Font Size (5)",
        "5 elements use font size below 10pt",
        results.Severity.Severe,
        details);
    results.addResult("Contrast",
                      "Text should stand out from background",
                      results.Severity.Info);
  });