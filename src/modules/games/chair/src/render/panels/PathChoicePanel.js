export function render(container, room, options = {}) {
  const { onChoosePath } = options;

  container.innerHTML = `
    <div class="room-title">⬦ Carrefour</div>
    <div class="room-body">
      <p class="insp-dim">La gorge se divise.</p>
    </div>`;

  const body = container.querySelector('.room-body');

  const b1 = document.createElement('button');
  b1.className = 'dealbtn';
  b1.innerHTML = 'Trachée <em style="font-variant:normal;margin-left:6px;font-size:.6em;color:var(--bone)">Air · Poumons</em>';
  b1.addEventListener('click', () => onChoosePath?.('poumons'));
  body.appendChild(b1);

  const b2 = document.createElement('button');
  b2.className = 'dealbtn';
  b2.innerHTML = 'Œsophage <em style="font-variant:normal;margin-left:6px;font-size:.6em;color:var(--bone)">Chair · Estomac</em>';
  b2.addEventListener('click', () => onChoosePath?.('estomac'));
  body.appendChild(b2);
}
