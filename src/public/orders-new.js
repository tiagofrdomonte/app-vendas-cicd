(function () {
  const form = document.getElementById('orderForm');
  if (!form) return;

  const container = document.getElementById('itemsContainer');
  const addBtn = document.getElementById('addItemBtn');

  const customerSearch = document.getElementById('customerSearch');
  const customerIdInput = document.getElementById('customerId');
  const customerResults = document.getElementById('customerResults');

  const customersRaw = form.getAttribute('data-customers') || '';
  const productsRaw = form.getAttribute('data-products') || '';
  const itemsRaw = form.getAttribute('data-existing-items') || '';

  let customers = [];
  let products = [];
  let existingItems = [];

  try {
    customers = JSON.parse(decodeURIComponent(customersRaw));
  } catch (err) {
    customers = [];
  }

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

  function hideCustomerResults() {
    customerResults.classList.add('d-none');
    customerResults.innerHTML = '';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function selectCustomer(customer) {
    customerSearch.value = customer.name;
    customerIdInput.value = customer.id;
    hideCustomerResults();
  }

  function renderCustomerResults(query) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      hideCustomerResults();
      return;
    }

    const matches = customers
      .filter(function (customer) {
        return customer.name.toLowerCase().includes(normalizedQuery);
      })
      .slice(0, 10);

    if (matches.length === 0) {
      customerResults.innerHTML = '<button type="button" class="list-group-item list-group-item-action disabled">Nenhum cliente encontrado</button>';
      customerResults.classList.remove('d-none');
      return;
    }

    customerResults.innerHTML = '';
    matches.forEach(function (customer) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'list-group-item list-group-item-action customer-option';
      button.setAttribute('data-id', customer.id);
      button.textContent = customer.name;
      customerResults.appendChild(button);
    });

    customerResults.classList.remove('d-none');

    customerResults.querySelectorAll('.customer-option').forEach(function (button) {
      button.addEventListener('click', function () {
        const customerId = button.getAttribute('data-id');
        const selected = customers.find(function (customer) {
          return String(customer.id) === String(customerId);
        });

        if (selected) {
          selectCustomer(selected);
        }
      });
    });
  }

  customerSearch.addEventListener('input', function () {
    const query = customerSearch.value;

    // Reset selected ID when user edits the search text.
    customerIdInput.value = '';
    customerSearch.setCustomValidity('');

    renderCustomerResults(query);
  });

  customerSearch.addEventListener('focus', function () {
    if (customerSearch.value.trim()) {
      renderCustomerResults(customerSearch.value);
    }
  });

  document.addEventListener('click', function (event) {
    const clickedInsideSearch = event.target === customerSearch || customerResults.contains(event.target);
    if (!clickedInsideSearch) {
      hideCustomerResults();
    }
  });

  function buildProductOptions(selectedId) {
    const defaultOption = '<option value="">Produto...</option>';
    const options = products
      .map(function (p) {
        const selected = String(selectedId) === String(p.id) ? 'selected' : '';
        return '<option value="' + p.id + '" ' + selected + '>' +
          escapeHtml(p.sku) + ' - ' + escapeHtml(p.name) + ' (R$ ' + Number(p.unit_price).toFixed(2) + ')' +
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

  form.addEventListener('submit', function (event) {
    reindexRows();

    if (!customerIdInput.value) {
      event.preventDefault();
      customerSearch.focus();
      customerSearch.setCustomValidity('Selecione um cliente na lista filtrada.');
      customerSearch.reportValidity();
      return;
    }

    customerSearch.setCustomValidity('');
  });

  if (existingItems.length > 0) {
    existingItems.forEach(function (item) {
      addItemRow(item);
    });
  } else {
    addItemRow();
  }
})();
