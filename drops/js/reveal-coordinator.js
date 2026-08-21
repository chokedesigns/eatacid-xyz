// =============================================================================
// DROPS VISUAL REVEAL COORDINATION
// =============================================================================

/**
 * Creates a one-time visual barrier without coupling the underlying work.
 * Callers start their work independently and mark only the minimum visual
 * dependencies ready.
 */
function createInitialRevealBarrier(requiredKeys, onCommit) {
  const pendingKeys = new Set(requiredKeys);
  let committed = false;

  return {
    markReady(key) {
      if (committed || !pendingKeys.has(key)) return false;

      pendingKeys.delete(key);
      if (pendingKeys.size > 0) return false;

      committed = true;
      onCommit();
      return true;
    },
    get committed() {
      return committed;
    },
    get pendingKeys() {
      return new Set(pendingKeys);
    }
  };
}

/** Applies a repeatable pending class while retaining the region in layout. */
function setRegionPending(element, className, pending) {
  if (!element) return;

  element.classList.toggle(className, pending);
  element.setAttribute('aria-busy', pending ? 'true' : 'false');
}

/** Keeps late NFT results from committing after the wallet authority changed. */
function isCurrentWalletProjection({
  generation,
  address,
  currentGeneration,
  currentAddress
}) {
  return generation === currentGeneration && address === currentAddress;
}

export {
  createInitialRevealBarrier,
  isCurrentWalletProjection,
  setRegionPending
};
