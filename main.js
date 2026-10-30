import { initNavigation } from './modules/navigation.js';
import { initCalculator } from './modules/calculator.js';
import { initForm } from './modules/form.js';
import { initAnalytics } from './modules/analytics.js';
import { initModels } from './modules/models.js';
initNavigation();
initForm();
initCalculator();
initModels();
initAnalytics();
document.querySelectorAll('[data-building]').forEach((a) =>
  a.addEventListener('click', () => {
    document.getElementById('buildingType').value = a.dataset.building;
  }),
);
