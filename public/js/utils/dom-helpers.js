export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child) {
      element.appendChild(child);
    }
  }
  return element;
}

export function $(selector) {
  return document.querySelector(selector);
}

export function $$(selector) {
  return document.querySelectorAll(selector);
}

export function setText(selector, text) {
  const elem = typeof selector === 'string' ? $(selector) : selector;
  if (elem) elem.textContent = text;
}

export function setHTML(selector, html) {
  const elem = typeof selector === 'string' ? $(selector) : selector;
  if (elem) elem.innerHTML = html;
}
