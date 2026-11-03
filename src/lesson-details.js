import {escapeHTML as e, highlightCode} from './core.js';

export function renderLessonDetails(component) {
  const properties = component.properties.map(([name, scope, description]) => `
    <div class="property-row">
      <dt><code>${e(name)}</code><span>${e(scope)}</span></dt>
      <dd>${e(description)}</dd>
    </div>`).join('');
  const commands = component.commands.map(([title, command, guidance], index) => `
    <li class="lesson-command">
      <div class="panel-heading">
        <h3>${e(title)}</h3>
        <button class="copy-button" data-copy-lesson-command="${index}"
          aria-label="Copiar comando: ${e(title)}">Copiar</button>
      </div>
      <pre class="code-block" tabindex="0"><code>${highlightCode(command, 'shell')}</code></pre>
      <p>${e(guidance)}</p>
    </li>`).join('');

  return `
    <section class="learning-panel lesson-reference" id="properties" aria-labelledby="properties-title">
      <h2 id="properties-title">Propiedades clave</h2>
      <p>Campos de la API, parámetros de configuración o indicadores según el tipo de componente.</p>
      <dl class="property-list">${properties}</dl>
    </section>
    <section class="learning-panel lesson-reference" id="commands" aria-labelledby="commands-title">
      <h2 id="commands-title">Comandos y cómo usarlos</h2>
      <p>Ajusta los nombres, el contexto y el namespace a tu entorno. Cada comando indica qué consultar y cómo interpretar el resultado.</p>
      <ul class="lesson-commands">${commands}</ul>
    </section>`;
}

export function renderProblemList(problems) {
  const simulations = [];
  const guides = [];
  for (const [index, problem] of problems.entries()) {
    const attribute = problem.diagnosticOnly ? 'data-case-guide' : 'data-problem';
    const button = `<button class="problem-button" ${attribute}="${index}"><strong>${e(problem.name)}</strong><span aria-hidden="true">›</span></button>`;
    (problem.diagnosticOnly ? guides : simulations).push(button);
  }

  return `
    <h3 class="problem-group-title">Simulaciones</h3>
    <div class="problem-list">${simulations.join('')}</div>
    <h3 class="problem-group-title">Guías de diagnóstico</h3>
    <div class="problem-list">${guides.join('')}</div>`;
}
