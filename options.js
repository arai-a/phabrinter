async function saveOptions(e) {
  e.preventDefault();

  const expireDays = parseInt(document.getElementById("expireDays").value, 10);
  await GlobalState.setExpireDays(expireDays);
}

async function loadOptions() {
  const expireDays = await GlobalState.getExpireDays();
  document.getElementById("expireDays").value = expireDays;

  await updateState();
}

async function updateState() {
  const patchCount = await GlobalState.getPatchCount();
  document.getElementById("state").textContent = `Reviewed state for ${patchCount} patch(es) are cached`;
}

async function clearState() {
  await GlobalState.clear();
  await updateState();
}

document.addEventListener("DOMContentLoaded", loadOptions);
document.getElementById("options").addEventListener("submit", saveOptions);
document.getElementById("clear").addEventListener("submit", clearState);
