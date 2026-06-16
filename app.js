// Flowmint waitlist — handles both signup forms with AJAX submission to Formspree.
// Replace YOUR_FORM_ID in index.html (the form "action" attributes) with your real
// Formspree endpoint, e.g. action="https://formspree.io/f/abcdwxyz".

(function () {
  "use strict";

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var forms = document.querySelectorAll("form.waitlist");

  forms.forEach(function (form) {
    var note = form.parentElement.querySelector(".waitlist__note");
    var button = form.querySelector(".waitlist__btn");
    var defaultNote = note ? note.textContent : "";

    form.addEventListener("submit", function (event) {
      var action = form.getAttribute("action") || "";

      // If the form endpoint hasn't been configured yet, don't fire a broken
      // request — guide the operator instead of confusing a visitor.
      if (action.indexOf("YOUR_FORM_ID") !== -1) {
        event.preventDefault();
        setNote(note, "⚠️ Waitlist endpoint not configured yet (see README).", "is-error");
        return;
      }

      event.preventDefault();
      var originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = "Joining…";

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            setNote(note, "🎉 You're on the list! Check your inbox to confirm.", "is-success");
            button.textContent = "You're in!";
          } else {
            return response.json().then(function (data) {
              var msg =
                data && data.errors && data.errors.length
                  ? data.errors.map(function (e) { return e.message; }).join(", ")
                  : "Something went wrong. Please try again.";
              throw new Error(msg);
            });
          }
        })
        .catch(function (err) {
          setNote(note, "😕 " + err.message, "is-error");
          button.disabled = false;
          button.textContent = originalLabel;
        });
    });

    function setNote(el, text, cls) {
      if (!el) return;
      el.textContent = text;
      el.classList.remove("is-success", "is-error");
      if (cls) el.classList.add(cls);
    }
  });
})();
