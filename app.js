// Sello waitlist — handles both signup forms with AJAX submission to Formspree.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  SET UP THE WAITLIST: paste your Formspree form ID below (one place).      │
// │  1. Create a free form at https://formspree.io                            │
// │  2. Copy the ID from its endpoint — e.g. for                              │
// │       https://formspree.io/f/abcdwxyz   the ID is  "abcdwxyz"             │
// │  3. Replace YOUR_FORM_ID with it. That's it — both forms pick it up.      │
// └─────────────────────────────────────────────────────────────────────────┘
var FORMSPREE_ID = "mykaveqr";

(function () {
  "use strict";

  var endpoint = "https://formspree.io/f/" + FORMSPREE_ID;
  var configured = FORMSPREE_ID && FORMSPREE_ID !== "YOUR_FORM_ID";

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var forms = document.querySelectorAll("form.waitlist");

  // Point every waitlist form at the configured endpoint — one source of truth.
  forms.forEach(function (form) {
    form.setAttribute("action", endpoint);
  });

  forms.forEach(function (form) {
    var note = form.parentElement.querySelector(".waitlist__note");
    var button = form.querySelector(".waitlist__btn");
    var defaultNote = note ? note.textContent : "";

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      // If the form endpoint hasn't been configured yet, don't fire a broken
      // request — guide the operator instead of confusing a visitor.
      if (!configured) {
        setNote(note, "⚠️ Waitlist not connected yet — set FORMSPREE_ID in app.js (see README).", "is-error");
        return;
      }

      var originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = "Joining…";

      fetch(endpoint, {
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
