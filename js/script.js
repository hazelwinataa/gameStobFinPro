/**
 * gameStoB - Main JavaScript
 */

var CART_STORAGE_KEY = "gamestob_cart";

document.addEventListener("DOMContentLoaded", function () {
  initGlitchBackground();
  initMobileNav();
  initHeroCarousel();
  initCatalogFilters();
  initProductCards();
  initCart();
  if (document.getElementById("cart-summary-list")) {
    initPurchaseCart();
  }
  initPurchaseForm();
  initNewsletterForm();
});

/* WooCommerce-style product cards */
function initProductCards() {
  var cards = document.querySelectorAll(".release-card");
  var i;
  for (i = 0; i < cards.length; i++) {
    enhanceReleaseCard(cards[i]);
  }

  document.addEventListener("click", function (event) {
    var buyBtn = event.target.closest(".btn-buy-now");
    var cartBtn = event.target.closest(".btn-add-cart");

    if (buyBtn) {
      event.preventDefault();
      window.location.href = "purchase.html";
      return;
    }

    if (cartBtn) {
      event.preventDefault();
      var card = cartBtn.closest(".release-card");
      if (card) {
        addToCart(getProductFromCard(card));
        showCartToast("Item successfully added to cart!");
      }
    }
  });
}

function enhanceReleaseCard(card) {
  if (!card.getAttribute("data-product-id")) {
    var nameAttr = card.getAttribute("data-name");
    var titleEl = card.querySelector(".release-card__title");
    var titleText = titleEl ? titleEl.textContent.trim() : "product";
    card.setAttribute("data-product-id", slugify(nameAttr || titleText));
  }

  if (card.querySelector(".release-card__actions")) return;

  var body = card.querySelector(".release-card__body");
  if (!body) return;

  var actions = document.createElement("div");
  actions.className = "release-card__actions";
  actions.innerHTML =
    '<button type="button" class="btn-card btn-buy-now">Buy Now</button>' +
    '<button type="button" class="btn-card btn-add-cart">Add to Cart</button>';
  body.appendChild(actions);
}

function getProductFromCard(card) {
  var titleEl = card.querySelector(".release-card__title");
  var subtitleEl = card.querySelector(".release-card__subtitle");
  var platformEl = card.querySelector(".release-card__platform");
  var priceEl = card.querySelector(".release-card__price");
  var priceValue = card.getAttribute("data-price") || "0";
  var priceLabel = priceEl ? priceEl.textContent.trim() : "USD " + priceValue;

  if (priceEl && !card.getAttribute("data-price")) {
    var parts = priceLabel.split(" ");
    if (parts.length > 1) {
      priceValue = parts[parts.length - 1];
    }
  }

  return {
    id: card.getAttribute("data-product-id"),
    title: titleEl ? titleEl.textContent.trim() : "Unknown Game",
    subtitle: subtitleEl ? subtitleEl.textContent.trim() : "",
    platform: platformEl ? platformEl.textContent.trim() : "",
    price: priceLabel,
    priceValue: priceValue
  };
}

function slugify(text) {
  var result = "";
  var str = String(text).toLowerCase();
  var c;
  var code;
  for (var i = 0; i < str.length; i++) {
    c = str.charAt(i);
    code = str.charCodeAt(i);
    if (
      (code >= 97 && code <= 122) ||
      (code >= 48 && code <= 57)
    ) {
      result += c;
    } else if (c === " " || c === "-" || c === ":") {
      result += "-";
    }
  }
  while (result.indexOf("--") !== -1) {
    result = result.split("--").join("-");
  }
  if (result.length > 0 && result.charAt(0) === "-") {
    result = result.substring(1);
  }
  return result || "game-item";
}

function initCart() {
  updateCartBadge();
  ensureCartToast();
}

function getCart() {
  try {
    var raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(product) {
  var cart = getCart();
  var found = false;
  var i;

  for (i = 0; i < cart.length; i++) {
    if (cart[i].id === product.id) {
      cart[i].qty = (cart[i].qty || 1) + 1;
      found = true;
      break;
    }
  }

  if (!found) {
    cart.push({
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      platform: product.platform,
      price: product.price,
      priceValue: product.priceValue,
      qty: 1
    });
  }

  saveCart(cart);
  updateCartBadge(true);
}

function getCartCount() {
  var cart = getCart();
  var total = 0;
  var i;
  for (i = 0; i < cart.length; i++) {
    total += cart[i].qty || 1;
  }
  return total;
}

function updateCartBadge(animate) {
  var badges = document.querySelectorAll("#cartBadge, .cart-badge");
  var count = getCartCount();
  var i;

  for (i = 0; i < badges.length; i++) {
    badges[i].textContent = String(count);
    if (animate) {
      badges[i].classList.add("pulse");
      setTimeout(function (el) {
        return function () {
          el.classList.remove("pulse");
        };
      }(badges[i]), 450);
    }
  }
}

function ensureCartToast() {
  if (document.getElementById("cartToast")) return;

  var toast = document.createElement("div");
  toast.id = "cartToast";
  toast.className = "cart-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.innerHTML =
    '<span class="cart-toast__icon" aria-hidden="true">&#10003;</span>' +
    '<span class="cart-toast__message"></span>';
  document.body.appendChild(toast);
}

var toastHideTimer = null;

function showCartToast(message) {
  ensureCartToast();
  var toast = document.getElementById("cartToast");
  var msgEl = toast.querySelector(".cart-toast__message");
  if (msgEl) msgEl.textContent = message;

  toast.classList.add("visible");
  if (toastHideTimer) clearTimeout(toastHideTimer);

  toastHideTimer = setTimeout(function () {
    toast.classList.remove("visible");
  }, 3200);
}

/* Mouse-following glitch background */
function initGlitchBackground() {
  var bg = document.getElementById("glitchBg");
  if (!bg) return;

  var glitchTimer = null;
  var smoothX = window.innerWidth / 2;
  var smoothY = window.innerHeight / 2;
  var targetX = smoothX;
  var targetY = smoothY;

  function setMouseVars(x, y) {
    document.documentElement.style.setProperty("--mouse-x", x + "px");
    document.documentElement.style.setProperty("--mouse-y", y + "px");
  }

  function onPointerMove(clientX, clientY) {
    targetX = clientX;
    targetY = clientY;

    var shiftX = (clientX - smoothX) * 0.08;
    var shiftY = (clientY - smoothY) * 0.08;
    document.documentElement.style.setProperty("--glitch-x", shiftX + "px");
    document.documentElement.style.setProperty("--glitch-y", shiftY + "px");
    document.documentElement.style.setProperty("--rgb-shift", shiftX + "px");

    bg.classList.add("glitch-active");
    if (glitchTimer) clearTimeout(glitchTimer);
    glitchTimer = setTimeout(function () {
      bg.classList.remove("glitch-active");
    }, 180);
  }

  document.addEventListener("mousemove", function (e) {
    onPointerMove(e.clientX, e.clientY);
  });

  document.addEventListener("touchmove", function (e) {
    if (e.touches.length > 0) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  function animate() {
    smoothX += (targetX - smoothX) * 0.12;
    smoothY += (targetY - smoothY) * 0.12;
    setMouseVars(smoothX, smoothY);
    requestAnimationFrame(animate);
  }

  setMouseVars(smoothX, smoothY);
  animate();
}

function initMobileNav() {
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    nav.classList.toggle("open");
  });

  var links = nav.querySelectorAll("a");
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener("click", function () {
      nav.classList.remove("open");
    });
  }
}

/* Hero carousel */
function initHeroCarousel() {
  var track = document.getElementById("heroTrack");
  var dotsContainer = document.getElementById("heroDots");
  var prevBtn = document.getElementById("heroPrev");
  var nextBtn = document.getElementById("heroNext");
  if (!track) return;

  var slides = track.children;
  var total = slides.length;
  var current = 0;
  var autoTimer = null;

  function goTo(index) {
    if (index < 0) current = total - 1;
    else if (index >= total) current = 0;
    else current = index;
    track.style.transform = "translateX(-" + current * 100 + "%)";
    updateDots();
  }

  function updateDots() {
    if (!dotsContainer) return;
    var dots = dotsContainer.querySelectorAll(".hero-dot");
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.toggle("active", d === current);
    }
  }

  if (dotsContainer) {
    for (var i = 0; i < total; i++) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hero-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Go to slide " + (i + 1));
      (function (idx) {
        dot.addEventListener("click", function () {
          goTo(idx);
          resetAuto();
        });
      })(i);
      dotsContainer.appendChild(dot);
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      goTo(current - 1);
      resetAuto();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      goTo(current + 1);
      resetAuto();
    });
  }

  function startAuto() {
    autoTimer = setInterval(function () {
      goTo(current + 1);
    }, 6000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  goTo(0);
  startAuto();
}

/* Catalog sort & filter */
function initCatalogFilters() {
  var grid = document.getElementById("catalogGrid");
  var sortSelect = document.getElementById("sortBy");
  var genreFilter = document.getElementById("genreFilter");
  var platformFilter = document.getElementById("platformFilter");
  if (!grid) return;

  function getCards() {
    return Array.prototype.slice.call(grid.querySelectorAll(".release-card"));
  }

  function applyFilters() {
    var genre = genreFilter ? genreFilter.value : "all";
    var platform = platformFilter ? platformFilter.value : "all";
    var cards = getCards();

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var cardGenre = card.getAttribute("data-genre") || "";
      var cardPlatform = card.getAttribute("data-platform") || "";
      var showGenre = genre === "all" || cardGenre === genre;
      var showPlatform = platform === "all" || cardPlatform === platform;
      card.style.display = showGenre && showPlatform ? "flex" : "none";
    }
  }

  function applySort() {
    var sort = sortSelect ? sortSelect.value : "default";
    var cards = getCards();

    cards.sort(function (a, b) {
      var priceA = parseFloat(a.getAttribute("data-price")) || 0;
      var priceB = parseFloat(b.getAttribute("data-price")) || 0;
      var nameA = (a.getAttribute("data-name") || "").toLowerCase();
      var nameB = (b.getAttribute("data-name") || "").toLowerCase();

      if (sort === "price-asc") return priceA - priceB;
      if (sort === "price-desc") return priceB - priceA;
      if (sort === "name") {
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      }
      return 0;
    });

    for (var i = 0; i < cards.length; i++) {
      grid.appendChild(cards[i]);
    }
  }

  function refresh() {
    applyFilters();
    applySort();
  }

  if (genreFilter) genreFilter.addEventListener("change", refresh);
  if (platformFilter) platformFilter.addEventListener("change", refresh);
  if (sortSelect) sortSelect.addEventListener("change", refresh);
}

/* Purchase page – load cart into Order Summary */
function initPurchaseCart() {
  var listEl = document.getElementById("cart-summary-list");
  if (!listEl) return;

  listEl.addEventListener("click", function (event) {
    var removeBtn = event.target.closest(".cart-remove-btn");
    if (!removeBtn) return;
    var productId = removeBtn.getAttribute("data-remove-id");
    if (productId) {
      removeFromCart(productId);
      renderPurchaseCart();
      updateCartBadge(false);
    }
  });

  renderPurchaseCart();
}

function removeFromCart(productId) {
  var cart = getCart();
  var newCart = [];
  var i;
  var item;

  for (i = 0; i < cart.length; i++) {
    item = cart[i];
    if (item.id !== productId) {
      newCart.push(item);
      continue;
    }
    if ((item.qty || 1) > 1) {
      item.qty = (item.qty || 1) - 1;
      newCart.push(item);
    }
  }

  saveCart(newCart);
}

function renderPurchaseCart() {
  var listEl = document.getElementById("cart-summary-list");
  var totalEl = document.getElementById("cart-total-price");
  var submitBtn = document.getElementById("submitPaymentBtn");
  var cart = getCart();

  if (!listEl) return;

  if (cart.length === 0) {
    listEl.innerHTML =
      '<p class="cart-summary-empty">Your cart is empty. Please add games from the catalog.</p>';
    if (totalEl) totalEl.textContent = "USD 0.00";
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  var html = "";
  var total = 0;
  var i;
  var item;
  var price;
  var qty;
  var lineTotal;

  for (i = 0; i < cart.length; i++) {
    item = cart[i];
    price = parseFloat(item.priceValue);
    if (isNaN(price)) price = 0;
    qty = item.qty || 1;
    lineTotal = price * qty;
    total += lineTotal;

    html +=
      '<div class="cart-summary-item">' +
      '<button type="button" class="cart-remove-btn" data-remove-id="' +
      escapeHtml(item.id) +
      '" aria-label="Remove ' +
      escapeHtml(item.title) +
      '">&minus;</button>' +
      '<h3 class="cart-summary-item__title">' +
      escapeHtml(item.title) +
      "</h3>" +
      '<p class="cart-summary-item__platform">' +
      escapeHtml(item.platform || "All Platforms") +
      "</p>" +
      '<span class="cart-summary-item__qty">x' +
      qty +
      "</span>" +
      '<p class="cart-summary-item__price">' +
      escapeHtml(item.price || "USD " + price.toFixed(2)) +
      (qty > 1 ? " (USD " + lineTotal.toFixed(2) + ")" : "") +
      "</p>" +
      "</div>";
  }

  listEl.innerHTML = html;
  if (totalEl) totalEl.textContent = "USD " + total.toFixed(2);
  if (submitBtn) submitBtn.disabled = false;
}

function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function calculateCartTotal(cart) {
  var total = 0;
  var i;
  var price;
  var qty;
  for (i = 0; i < cart.length; i++) {
    price = parseFloat(cart[i].priceValue);
    if (isNaN(price)) price = 0;
    qty = cart[i].qty || 1;
    total += price * qty;
  }
  return total;
}

/* Purchase validation - NO REGEX */
function initPurchaseForm() {
  var form = document.getElementById("purchaseForm");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAllErrors();

    var cart = getCart();
    if (cart.length === 0) {
      alert("Your cart is empty. Please add games from the catalog.");
      return;
    }

    var isValid = true;
    var fullName = document.getElementById("fullName");
    var cardNumber = document.getElementById("cardNumber");
    var cvv = document.getElementById("cvv");
    var terms = document.getElementById("terms");
    var expMonth = document.getElementById("expMonth");
    var expYear = document.getElementById("expYear");
    var successBox = document.getElementById("formSuccess");

    if (successBox) successBox.classList.remove("visible");

    var nameValue = fullName ? fullName.value.trim() : "";
    if (nameValue.length === 0) {
      showError("fullNameError", "Full name is required.");
      isValid = false;
    } else if (nameValue.length < 3) {
      showError("fullNameError", "Full name must be at least 3 characters.");
      isValid = false;
    }

    var cardValue = cardNumber ? cardNumber.value.trim() : "";
    if (cardValue.length !== 16) {
      showError("cardNumberError", "Credit card number must be exactly 16 digits.");
      isValid = false;
    } else if (isNaN(Number(cardValue)) || !isNumericString(cardValue)) {
      showError("cardNumberError", "Credit card number must contain only numbers.");
      isValid = false;
    }

    var monthVal = expMonth ? expMonth.value : "";
    var yearVal = expYear ? expYear.value : "";
    if (monthVal === "" || yearVal === "") {
      showError("expirationError", "Please select expiration month and year.");
      isValid = false;
    }

    var cvvValue = cvv ? String(cvv.value).trim() : "";
    if (cvvValue.length !== 3) {
      showError("cvvError", "CVV must be exactly 3 digits.");
      isValid = false;
    } else if (isNaN(Number(cvvValue)) || !isNumericString(cvvValue)) {
      showError("cvvError", "CVV must contain only numbers.");
      isValid = false;
    }

    if (!terms || !terms.checked) {
      showError("termsError", "You must agree to the Terms & Conditions.");
      isValid = false;
    }

    if (isValid) {
      if (successBox) successBox.classList.add("visible");
      alert("Payment validated successfully! Thank you for shopping at gameStoB.");
      saveCart([]);
      updateCartBadge(false);
      form.reset();
      renderPurchaseCart();
    }
  });
}

function initNewsletterForm() {
  var form = document.getElementById("newsletterForm");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    alert("Thank you for subscribing to the gameStoB newsletter!");
    form.reset();
  });
}

function isNumericString(str) {
  if (str.length === 0) return false;
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    if (isNaN(code) || code < 48 || code > 57) return false;
  }
  return true;
}

function showError(id, message) {
  var el = document.getElementById(id);
  if (el) el.textContent = message;
}

function clearAllErrors() {
  var ids = [
    "fullNameError",
    "cardNumberError",
    "expirationError",
    "cvvError",
    "termsError"
  ];
  for (var i = 0; i < ids.length; i++) showError(ids[i], "");
}
