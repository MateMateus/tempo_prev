/**
 * Utilitários para renderização de estados de interface (Skeleton Loaders).
 */

/**
 * Renderiza a estrutura de Skeleton Loaders para o Grid de Cards de Regiões ou Capitais.
 * @param {number} quantidade - Quantidade de cards de skeleton.
 * @returns {string} HTML string com os cards de esqueleto.
 */
export function renderGridSkeleton(quantidade = 8) {
    return Array.from({ length: quantidade }).map(() => `
        <div class="skeleton-card skeleton">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div class="skeleton-title skeleton" style="margin-bottom: 0.4rem;"></div>
                    <div class="skeleton-text skeleton" style="width: 40%;"></div>
                </div>
                <div class="skeleton-circle skeleton"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                <div class="skeleton-title skeleton" style="width: 30%; height: 2.2rem;"></div>
                <div class="skeleton-text skeleton" style="width: 25%; height: 1.8rem; border-radius: 4px;"></div>
            </div>
        </div>
    `).join('');
}
