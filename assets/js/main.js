/* =========================================
   Maxband - Main JavaScript
   ========================================= */

(function () {
  'use strict';

  // ---------- Configuration ----------
  var CONFIG = {
    whatsappNumber: '8613805733952',           // +86-13805733952
    contactEmail: 'joe@jandj.cc',
    companyName: 'Maxband',
  };

  // ---------- WhatsApp prefill message ----------
  function buildWhatsAppURL(productHint) {
    var base = 'https://wa.me/' + CONFIG.whatsappNumber;
    var msg = 'Hi Maxband, I would like to inquire about';
    if (productHint) {
      msg += ' ' + productHint;
    } else {
      msg += ' your SS201 banding products';
    }
    msg += '. Please send me pricing and MOQ. (Sent from maxband.cn)';
    return base + '?text=' + encodeURIComponent(msg);
  }

  // ---------- Wire WhatsApp floating button ----------
  document.addEventListener('DOMContentLoaded', function () {
    var waBtn = document.querySelector('.whatsapp-float');
    if (waBtn) {
      waBtn.setAttribute('href', buildWhatsAppURL());
      waBtn.setAttribute('target', '_blank');
      waBtn.setAttribute('rel', 'noopener noreferrer');
    }

    // Wire per-product WhatsApp CTAs (data attribute carries product name)
    var productBtns = document.querySelectorAll('[data-wa-product]');
    productBtns.forEach(function (btn) {
      var hint = btn.getAttribute('data-wa-product');
      btn.setAttribute('href', buildWhatsAppURL(hint));
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
    });

    // Mobile nav toggle
    var toggle = document.querySelector('.mobile-toggle');
    var nav = document.querySelector('.nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        nav.classList.toggle('open');
      });
    }

    // Contact form -> mailto
    var form = document.querySelector('#contact-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name    = (form.querySelector('[name="name"]')    || {}).value || '';
        var company = (form.querySelector('[name="company"]') || {}).value || '';
        var email   = (form.querySelector('[name="email"]')   || {}).value || '';
        var phone   = (form.querySelector('[name="phone"]')   || {}).value || '';
        var product = (form.querySelector('[name="product"]') || {}).value || '';
        var message = (form.querySelector('[name="message"]') || {}).value || '';

        var subject = 'Inquiry from ' + (name || 'website visitor');
        if (product) subject += ' - ' + product;

        var bodyLines = [
          'Name: '    + name,
          'Company: ' + company,
          'Email: '   + email,
          'Phone: '   + phone,
          'Product of interest: ' + product,
          '',
          'Message:',
          message,
          '',
          '--',
          'Sent from maxband.cn contact form'
        ];

        var mailto = 'mailto:' + CONFIG.contactEmail
                   + '?subject=' + encodeURIComponent(subject)
                   + '&body='    + encodeURIComponent(bodyLines.join('\n'));

        window.location.href = mailto;
      });
    }

    // Smooth-scroll for in-page anchors
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = link.getAttribute('href');
        if (target.length > 1) {
          var el = document.querySelector(target);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  });
})();