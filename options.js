async function saveOptions(e) {
  e.preventDefault();

  const expireDays = parseInt(document.getElementById("expireDays").value, 10);
  await GlobalState.setExpireDays(expireDays);
}

async function loadOptions() {
  const expireDays = await GlobalState.getExpireDays();
  document.getElementById("expireDays").value = expireDays;

  const patchCount = await GlobalState.getPatchCount();
  document.getElementById("state").textContent = `Reviewed state for ${patchCount} patch(es) are cached`;
}

document.addEventListener("DOMContentLoaded", loadOptions);
document.getElementById("options").addEventListener("submit", saveOptions);
