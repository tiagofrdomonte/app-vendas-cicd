(function () {
  const form = document.getElementById('orderForm');
  if (!form) return;

  const container = document.getElementById('itemsContainer');
  const addBtn = document.getElementById('addItemBtn');

  const productsRaw = form.getAttribute('data-products') || '';
  const itemsRaw = form.getAttribute('data-existing-items') || '';

  let products = [];
  let existingItems = [];

  try {
    products = JSON.parse(decodeURIComponent(productsRaw));
  } catch (err) {
    products = [];
  }

  try {
    existingItems = JSON.parse(decodeURIComponent(itemsRaw));
  } catch (err) {
    existingItems = [];
  }

  function buildProductOptions(selectedId) {
    const defaultOption = '<option value="">Produto...</option>';
    const options = products
      .map(function (p) {
        const selected = String(selectedId) === String(p.id) ? 'selected' : '';
        return '<option value="' + p.id + '" ' + selected + '>' +
          p.sku + ' - ' + p.name + ' (R$ ' + Number(p.unit_price).toFixed(2) + ')' +
          '</option>';
      })
      .join('');

    return defaultOption + options;
  }

  function reindexRows() {
    const rows = container.querySelectorAll('.item-row');
    rows.forEach(function (row, index) {
      row.querySelector('.product-select').setAttribute('name', 'items[' + index + '][product_id]');
      row.querySelector('.quantity-input').setAttribute('name', 'items[' + index + '][quantity]');
    });
  }

  function addItemRow(item) {
    const safeItem = item || {};
    const row = document.createElement('div');

    row.className = 'row g-2 align-items-end border rounded p-2 item-row';
    row.innerHTML =
      '<div class="col-md-8">' +
        '<label class="form-label">Produto</label>' +
        '<select class="form-select product-select" required>' +
          buildProductOptions(safeItem.product_id || '') +
        '</select>' +
      '</div>' +
      '<div class="col-md-3">' +
        '<label class="form-label">Quantidade</label>' +
        '<input class="form-control quantity-input" type="number" min="1" max="9999" value="' + (safeItem.quantity || 1) + '" required>' +
      '</div>' +
      '<div class="col-md-1 d-grid">' +
        '<button type="button" class="btn btn-outline-danger remove-item">X</button>' +
      '</div>';

    row.querySelector('.remove-item').addEventListener('click', function () {
      row.remove();
      reindexRows();
    });

    container.appendChild(row);
    reindexRows();
  }

  addBtn.addEventListener('click', function () {
    addItemRow();
  });

  form.addEventListener('submit', function () {
    reindexRows();
  });

  if (existingItems.length > 0) {
    existingItems.forEach(function (item) {
      addItemRow(item);
    });
  } else {
    addItemRow();
  }
})();
