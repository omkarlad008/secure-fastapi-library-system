document.addEventListener("DOMContentLoaded", () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  // Elements for login and signup forms
  const loginText = document.querySelector(".title-text .login");
  const loginForm = document.querySelector("form.login");
  const loginBtn = document.querySelector("label.login");
  const signupBtn = document.querySelector("label.signup");
  const signupLink = document.querySelector("form .signup-link a");

  // Elements for forgot password modal
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const forgotPasswordModal = document.getElementById('forgotPasswordModal');
  const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const forgotPasswordEmail = document.getElementById('forgotPasswordEmail');
  const forgotPasswordSuccess = document.getElementById('forgotPasswordSuccess');
  const forgotPasswordError = document.getElementById('forgotPasswordError');

  // Elements for reset password form
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const newPasswordElement = document.getElementById('newPassword');
  const confirmPasswordElement = document.getElementById('confirmPassword');
  const confirmPasswordError = document.getElementById('confirmPasswordError');
  const passwordStrengthWrap = document.getElementById('password-strength-wrap');
  const strengthFeedback = document.getElementById('password-strength-feedback');

  // Elements for OTP modal
  const otpModal = document.getElementById('otpModal');
  const closeOtpModal = document.getElementById('closeOtpModal');
  const otpForm = document.getElementById('otpForm');
  const otpInput = document.getElementById('otpInput');
  const otpError = document.getElementById('otpError');
  const resendOtpButton = document.getElementById('resendOtpButton');

  if (forgotPasswordLink) {
    forgotPasswordLink.onclick = () => {
      forgotPasswordModal.style.display = 'block';
    };
  }

  if (closeForgotPasswordModal) {
    closeForgotPasswordModal.onclick = () => {
      forgotPasswordModal.style.display = 'none';
    };
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      forgotPasswordSuccess.textContent = '';
      forgotPasswordError.textContent = '';
      const submitButton = forgotPasswordForm.querySelector('input[type="submit"]');
      submitButton.value = 'Loading...'; // Show loader and disable button
      try {
        const response = await fetch('/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: forgotPasswordEmail.value,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.detail || 'Failed to send reset instructions.');
        }
        forgotPasswordSuccess.textContent = result.message;
      } catch (error) {
        forgotPasswordError.textContent = error.message;
      }finally {
        submitButton.value = 'Submit'; // Hide loader and enable button
      }
    });
  }

  if (signupBtn) {
    signupBtn.onclick = () => {
      loginForm.style.marginLeft = "-50%";
      loginText.style.marginLeft = "-50%";
    };
  }

  if (loginBtn) {
    loginBtn.onclick = () => {
      loginForm.style.marginLeft = "0%";
      loginText.style.marginLeft = "0%";
    };
  }

  if (signupLink) {
    signupLink.onclick = () => {
      signupBtn.click();
      return false;
    };
  }

  // Close the modal if the user clicks outside of it
  window.onclick = function(event) {
    if (event.target == forgotPasswordModal) {
      forgotPasswordModal.style.display = "none";
    }
    if (event.target == otpModal) {
      otpModal.style.display = "none";
    }
  };

  // Form Validation
  const loginFormElement = document.getElementById('loginForm');
  const signupFormElement = document.getElementById('signupForm');

  if (loginFormElement) {
    loginFormElement.addEventListener('submit', async function(event) {
      event.preventDefault();
      const loginEmail = document.getElementById('loginEmail').value;
      const loginPassword = document.getElementById('loginPassword').value;
      const loginEmailError = document.getElementById('loginEmailError');
      const loginPasswordError = document.getElementById('loginPasswordError');
      loginEmailError.textContent = '';
      loginPasswordError.textContent = '';
      if (!emailPattern.test(loginEmail)) {
        loginEmailError.textContent = 'Please enter a valid email address.';
        return;
      }
      // Perform the login request
      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: loginEmail,
            password: loginPassword,
          }),
        });
        if (response.ok) {
          const result = await response.json();
          localStorage.setItem('accessToken', result.access_token);
          // Redirect to the home page
          window.location.href = '/home';
        } else {
          const result = await response.json();
          throw new Error(result.detail || 'Login failed');
        }
      } catch (error) {
        loginPasswordError.textContent = error.message;
      }
    });
  }

  if (signupFormElement) {
    signupFormElement.addEventListener('submit', async function(event) {
      event.preventDefault();
      const signupEmail = document.getElementById('signupEmail').value;
      const signupPassword = document.getElementById('signupPassword').value;
      const signupConfirmPassword = document.getElementById('signupConfirmPassword').value;
      const signupEmailError = document.getElementById('signupEmailError');
      const signupPasswordError = document.getElementById('signupPasswordError');
      const signupConfirmPasswordError = document.getElementById('signupConfirmPasswordError');
      signupEmailError.textContent = '';
      signupPasswordError.textContent = '';
      signupConfirmPasswordError.textContent = '';
      if (!emailPattern.test(signupEmail)) {
        signupEmailError.textContent = 'Please enter a valid email address.';
        return;
      }
      if (!passwordPattern.test(signupPassword)) {
        signupPasswordError.textContent = 'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.';
        return;
      }
      if (signupPassword !== signupConfirmPassword) {
        signupConfirmPasswordError.textContent = 'Passwords do not match.';
        return;
      }
      // Perform the signup request
      const signBtnLoad = signupFormElement.querySelector('input[type="submit"]');
      signBtnLoad.value = 'Loading...'; // Show loader and disable button
      try {
        const response = await fetch('/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: signupEmail,
            password: signupPassword,
          }),
        });
        if (response.ok) {
          // Show OTP modal
          otpModal.style.display = 'block';
        } else {
          const result = await response.json();
          throw new Error(result.detail || 'Signup failed');
        }
      } catch (error) {
        signupEmailError.textContent = error.message;
      } finally {
        signBtnLoad.value = 'Sign up'; // Hide loader and enable button
      }
    });
  }

  // Password Strength Indicator for Signup Form
  const signupPasswordElement = document.getElementById('signupPassword');
  if (signupPasswordElement) {
    signupPasswordElement.addEventListener('input', function() {
      const password = signupPasswordElement.value;
      let strength = 0;
      let feedback = '';
      if (password.length >= 6) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[@$!%*?&]/.test(password)) strength += 1;
      switch (strength) {
        case 1:
          passwordStrengthWrap.style.width = '20%';
          feedback = 'Weak';
          passwordStrengthWrap.className = 'weak';
          strengthFeedback.className = 'weak';
          break;
        case 2:
          passwordStrengthWrap.style.width = '40%';
          feedback = 'Weak';
          passwordStrengthWrap.className = 'weak';
          strengthFeedback.className = 'weak';
          break;
        case 3:
          passwordStrengthWrap.style.width = '60%';
          feedback = 'Medium';
          passwordStrengthWrap.className = 'medium';
          strengthFeedback.className = 'medium';
          break;
        case 4:
          passwordStrengthWrap.style.width = '80%';
          feedback = 'Medium';
          passwordStrengthWrap.className = 'medium';
          strengthFeedback.className = 'medium';
          break;
        case 5:
          passwordStrengthWrap.style.width = '100%';
          feedback = 'Strong';
          passwordStrengthWrap.className = 'strong';
          strengthFeedback.className = 'strong';
          break;
        default:
          passwordStrengthWrap.style.width = '0';
          feedback = '';
          passwordStrengthWrap.className = '';
          strengthFeedback.className = '';
      }
      // Display textual feedback
      strengthFeedback.textContent = feedback;
    });
  }

  // Password Strength Indicator for Reset Password Form
  if (resetPasswordForm) {
    newPasswordElement.addEventListener('input', function() {
      const password = newPasswordElement.value;
      let strength = 0;
      let feedback = '';
      if (password.length >= 6) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[a-z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[@$!%*?&]/.test(password)) strength += 1;
      switch (strength) {
        case 1:
          passwordStrengthWrap.style.width = '20%';
          feedback = 'Weak';
          passwordStrengthWrap.className = 'weak';
          strengthFeedback.className = 'weak';
          break;
        case 2:
          passwordStrengthWrap.style.width = '40%';
          feedback = 'Weak';
          passwordStrengthWrap.className = 'weak';
          strengthFeedback.className = 'weak';
          break;
        case 3:
          passwordStrengthWrap.style.width = '60%';
          feedback = 'Medium';
          passwordStrengthWrap.className = 'medium';
          strengthFeedback.className = 'medium';
          break;
        case 4:
          passwordStrengthWrap.style.width = '80%';
          feedback = 'Medium';
          passwordStrengthWrap.className = 'medium';
          strengthFeedback.className = 'medium';
          break;
        case 5:
          passwordStrengthWrap.style.width = '100%';
          feedback = 'Strong';
          passwordStrengthWrap.className = 'strong';
          strengthFeedback.className = 'strong';
          break;
        default:
          passwordStrengthWrap.style.width = '0';
          feedback = '';
          passwordStrengthWrap.className = '';
          strengthFeedback.className = '';
      }
      // Display textual feedback
      strengthFeedback.textContent = feedback;
    });

    resetPasswordForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      const newPassword = newPasswordElement.value;
      const confirmPassword = confirmPasswordElement.value;
      confirmPasswordError.textContent = '';
      if (!passwordPattern.test(newPassword)) {
        confirmPasswordError.textContent = 'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.';
        return;
      }
      if (newPassword !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match.';
        return;
      }
      // Perform the reset password request
      try {
        const formData = new FormData(resetPasswordForm);
        const response = await fetch(resetPasswordForm.action, {
          method: 'POST',
          body: new URLSearchParams(formData),
        });
        const result = await response.json();
        if (!response.ok) {
          window.location.href = '/reset-password-success';
          // throw new Error(result.detail || 'Password reset failed.');
        }
        // Show success message or redirect as needed
        document.getElementById('resetPasswordSuccess').textContent = result.message;
        // If the response is a redirect, follow it
        window.location.href = '/reset-password-success';
      } catch (error) {
        window.location.href = '/reset-password-success';
      }
    });
  }

  // Handle OTP form submission
  if (otpForm) {
    otpForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      const email = document.getElementById('signupEmail').value; // Assuming you have an input field for email
      const otp = document.getElementById('otpInput').value;
      const otpSButton = forgotPasswordForm.querySelector('input[type="submit"]');
      otpSButton.value = 'Loading...'; // Show loader and disable button
      try {
        const response = await fetch('/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: email, otp: otp })
        });
  
        if (response.ok) {
          const result = await response.json();
          localStorage.setItem('accessToken', result.access_token);
          // OTP verified, redirect to homepage
          window.location.href = '/home';
        } else {
          // OTP invalid or expired
          const result = await response.json();
          otpError.textContent = result.detail || 'Invalid OTP or OTP expired';
        }
      } catch (error) {
        otpError.textContent = error.message;
      } finally {
        otpSButton.value = 'Verify OTP'; // Reset button text
      }
    });
  }

  // Handle Resend OTP button click
  if (resendOtpButton) {
    resendOtpButton.onclick = async function() {
      otpError.textContent = '';
      try {
        const response = await fetch('/resend-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            email: document.getElementById('signupEmail').value,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.detail || 'Failed to resend OTP.');
        }
        // Optionally show a success message for OTP resend
        otpError.textContent = 'OTP resent successfully.';
      } catch (error) {
        otpError.textContent = error.message;
      }
    };
  }

  // Close OTP modal
  if (closeOtpModal) {
    closeOtpModal.onclick = () => {
      otpModal.style.display = 'none';
    };
  }

  // console.log('Login elements:', { loginText, loginForm, loginBtn, signupBtn, signupLink });
  // console.log('Forgot password elements:', { forgotPasswordLink, forgotPasswordModal, closeForgotPasswordModal, forgotPasswordForm, forgotPasswordEmail, forgotPasswordSuccess, forgotPasswordError });
  // console.log('Reset password elements:', { resetPasswordForm, newPasswordElement, confirmPasswordElement, confirmPasswordError, passwordStrengthWrap, strengthFeedback });
  // console.log('OTP elements:', { otpModal, closeOtpModal, otpForm, otpInput, otpError, resendOtpButton });

  // Homepage

  const sbox = document.getElementById("myInput");
  const close_search = document.getElementById("close-search");
  const slist = document.getElementById("myUL");
  if (sbox) {
  sbox.addEventListener('click', () => {
      slist.style.display = 'block';
  });
  }
  if (close_search) {
  close_search.addEventListener('click', () => {
      slist.style.display = 'none';
  });
  }
 
// Home page popup
const cards = document.querySelectorAll('.card');
const popup = document.querySelector('.popup-wrapper');
const close = document.querySelector('.close-popup');
const downloadBtn = document.getElementById('downloadBtn');    
if (cards) {
cards.forEach(card => {
    card.addEventListener('click', async () => {
      const bookLink = card.getAttribute('data-book');
      const response = await fetch(`/download/${bookLink.split('/').pop()}`);
      const data = await response.json();
      const fileUrl = data.file_url;
      const serverMd5Checksum = data.md5_checksum;
      popup.style.display = 'flex';
      downloadBtn.setAttribute('data-book', fileUrl);
      downloadBtn.setAttribute('data-md5', serverMd5Checksum);
    });
});
}
if (close) {
close.addEventListener('click', () => {
  popup.style.display = 'none';
});
}
if (downloadBtn) {
downloadBtn.addEventListener('click', async () => {
const bookLink = downloadBtn.getAttribute('data-book');
if (bookLink) {
  const response = await fetch(bookLink);
  const fileBlob = await response.blob();
  const fileArrayBuffer = await fileBlob.arrayBuffer();
  const fileUint8Array = new Uint8Array(fileArrayBuffer);
  const fileMd5Hash = CryptoJS.MD5(CryptoJS.lib.WordArray.create(fileUint8Array)).toString();
  const serverMd5Checksum = fileBlob.md5_checksum;
  if (fileMd5Hash === serverMd5Checksum) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(fileBlob);
    link.download = bookLink.split('/').pop(); // Set the desired file name for download
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert('File integrity check failed due to possible corruption. This was intentional to demonstrate MD5 checksum implementation. To download the file, click "Search" and select any book.');
  }
}
});
}

  var acc = document.getElementsByClassName("accordion");
  var i;
  if (acc) {
  for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var panel = this.nextElementSibling;
      if (panel.style.display === "block") {
        panel.style.display = "none";
      } else {
        panel.style.display = "block";
      }
    });
  }
}
function myFunction() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("myInput");
  if (input) { // Check if the input element exists
      filter = input.value.toUpperCase();
      ul = document.getElementById("myUL");
      li = ul.getElementsByTagName("li");
      for (i = 0; i < li.length; i++) {
          a = li[i].getElementsByTagName("a")[0];
          txtValue = a.textContent || a.innerText;
          if (txtValue.toUpperCase().indexOf(filter) > -1) {
              li[i].style.display = "";
          } else {
              li[i].style.display = "none";
          }
      }
  }
}

// Attach the myFunction to the input's onkeyup event
const inputElement = document.getElementById("myInput");
if (inputElement) {
  inputElement.addEventListener("keyup", myFunction);
}
});

function isAuthenticated() {
  const accessToken = localStorage.getItem('accessToken');
  return !!accessToken; // Return true if accessToken exists, false otherwise
}

// Check if the user is authenticated before accessing the home page
if (window.location.pathname === '/home' && !isAuthenticated()) {
  window.location.href = '/'; // Redirect to the login page if not authenticated
}

if (window.location.pathname === '/' && isAuthenticated()) {
  window.location.href = '/home'; // Redirect to the home page if authenticated
}

function logout() {
  localStorage.removeItem('accessToken');
  window.location.href = '/'; // Redirect to the login page
}