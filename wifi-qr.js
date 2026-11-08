// Jibo's Wi-Fi QR code, the format his Settings skill scans (skills/settings _readQR/_parseQRData):
// each code is "<n>/<total>\n" + a slice of the network lines XOR'd with Jibo's key. Nothing leaves the browser.
(function () {
  'use strict';
  var KEY = 'Wow, you cracked our secret code. Impressive. Maybe you should check out jibo.com/jobs.';
  var PER_CODE = 80; // characters per code; longer settings are split over several codes, which Jibo asks for in turn
  var IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

  // Lines Jibo reads: ssid, password, static ip, netmask, gateway, dns1, dns2, then an access token (unused by 5x1).
  function codes(f) {
    var plain = [f.ssid, f.password, f.ip, f.netmask, f.gateway, f.dns1, f.dns2, ''].join('\n');
    var scrambled = '';
    for (var i = 0; i < plain.length; i++) {
      scrambled += String.fromCharCode(plain.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
    }
    var total = Math.ceil(scrambled.length / PER_CODE);
    var out = [];
    for (var n = 0; n < total; n++) out.push((n + 1) + '/' + total + '\n' + scrambled.substr(n * PER_CODE, PER_CODE));
    return out;
  }

  function problem(f) {
    if (!f.ssid) return 'Type your network name.';
    // Jibo's scanner guesses the character set of anything beyond plain ASCII and can misread it.
    if (/[^\x20-\x7e]/.test(f.ssid + f.password)) return 'Jibo’s scanner only reads plain letters, numbers, spaces and symbols on a US keyboard. Accented letters and emoji in the name or password can’t be scanned.';
    if (f.password && (f.password.length < 8 || f.password.length > 63)) return 'Wi-Fi passwords are 8 to 63 characters long.';
    var statics = [f.ip, f.netmask, f.gateway, f.dns1, f.dns2];
    if (statics.some(Boolean)) {
      if (!f.ip || !f.netmask || !f.gateway) return 'A static IP needs the IP address, netmask and gateway.';
      for (var i = 0; i < statics.length; i++) if (statics[i] && !IPV4.test(statics[i])) return statics[i] + ' isn’t an IP address like 192.168.1.50.';
    }
    return null;
  }

  var form = document.getElementById('qr-form');
  if (!form) {
    window.jiboWifiCodes = codes; // for tests
    return;
  }
  var output = document.getElementById('qr-output');
  var error = document.getElementById('qr-error');
  var password = document.getElementById('qr-password');
  var show = document.getElementById('qr-show');

  show.addEventListener('click', function () {
    var visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    show.textContent = visible ? 'Hide' : 'Show';
    show.setAttribute('aria-pressed', String(visible));
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var f = {};
    ['ssid', 'password', 'ip', 'netmask', 'gateway', 'dns1', 'dns2'].forEach(function (name) {
      var value = form.elements[name].value;
      f[name] = name === 'ssid' || name === 'password' ? value : value.trim();
    });
    var message = problem(f);
    error.hidden = !message;
    error.textContent = message || '';
    if (message) return;
    var list = codes(f);
    output.innerHTML = '';
    list.forEach(function (text, i) {
      var qr = qrcode(0, 'M');
      qr.addData(text, 'Byte');
      qr.make();
      var figure = document.createElement('figure');
      figure.className = 'qr-code';
      figure.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 4, scalable: true, alt: 'Wi-Fi code ' + (i + 1) + ' of ' + list.length + ' for Jibo' });
      var caption = document.createElement('figcaption');
      caption.textContent = list.length > 1 ? 'Code ' + (i + 1) + ' of ' + list.length : 'Show this to Jibo';
      figure.appendChild(caption);
      output.appendChild(figure);
    });
  });
})();
