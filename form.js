(() => {
  const form = document.querySelector("#catco-enquiry");
  if (!form) return;
  const fields = [...form.querySelectorAll("[required]")];
  const button = form.querySelector("[type=submit]");
  const status = form.querySelector("[role=status]");
  const missing = {
    name: "Enter your full name.",
    email: "Enter your email address.",
    phone: "Enter your phone number.",
    interest: "Choose a product, service or “Help me choose”.",
    message: "Tell us about your energy needs.",
  };
  form.noValidate = true;

  function validate(field) {
    const value = field.value.trim();
    let error = "";
    if (!value) error = missing[field.name];
    else if (field.validity.typeMismatch)
      error = "Enter a valid email address.";
    else if (
      field.name === "phone" &&
      (!/^\+?[0-9\s().-]+$/.test(value) ||
        !/^\d{7,15}$/.test(value.replace(/\D/g, "")))
    ) {
      error = "Enter a valid phone number with 7 to 15 digits.";
    }
    field.setAttribute("aria-invalid", String(Boolean(error)));
    document.getElementById(field.name + "-error").textContent = error;
    return !error;
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-interest]");
    if (
      link &&
      [...form.elements.interest.options].some(
        (option) => option.value === link.dataset.interest,
      )
    ) {
      form.elements.interest.value = link.dataset.interest;
      validate(form.elements.interest);
    }
  });
  form.addEventListener("input", (event) => {
    if (event.target.getAttribute("aria-invalid") === "true")
      validate(event.target);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    status.removeAttribute("data-error");
    const invalid = fields.filter((field) => !validate(field));
    if (invalid.length) {
      status.textContent = "Please check the highlighted fields.";
      status.setAttribute("data-error", "");
      invalid[0].focus();
      return;
    }
    button.disabled = true;
    button.textContent = "Submitting…";
    status.textContent = "";
    const body = new URLSearchParams(new FormData(form));
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!response.ok) throw new Error("Submission failed");
      status.textContent = "Thank you. Your enquiry has been submitted.";
      form.reset();
    } catch {
      status.setAttribute("data-error", "");
      status.textContent =
        "We couldn’t submit your enquiry. Please try again or contact CATCO by phone or email.";
    } finally {
      button.disabled = false;
      button.textContent = "Submit Enquiry";
    }
  });
})();
