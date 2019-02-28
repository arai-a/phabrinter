class GlobalState {
  static async loadPatch(patchName) {
    const state = await this._load();
    if (!(patchName in state.patches)) {
      return null;
    }
    return state.patches[patchName].reviewedState;
  }

  static async addPatch(patchName, reviewedState) {
    const state = await this._load();
    state.patches[patchName] = {
      reviewedState,
      lastModified: Date.now(),
    };
    await this._save(state);
    await this._expire(state);
  }

  static async getPatchCount() {
    const state = await this._load();
    return Object.keys(state.patches).length;
  }

  static async getExpireDays() {
    const state = await this._load();
    return state.expireDays;
  }

  static async setExpireDays(expireDays) {
    const state = await this._load();
    state.expireDays = expireDays;
    await this._save(state);
    await this._expire(state);
  }

  static async clear() {
    const state = await this._load();
    const patchNames = Object.keys(state.patches);

    state.patches = {};
    await this._save(state);
  }

  static async _expire(state) {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (this.expiring) {
      return;
    }
    if (now < state.lastExpireCheck + oneDay) {
      return;
    }

    this.expiring = true;

    state.lastExpireCheck = now;

    for (const patchName of Object.keys(state.patches)) {
      const patch = state.patches[patchName];
      if (now > patch.lastModified + state.expireDays * oneDay) {
        delete state.patches[patchName];
      }
    }

    await this._save(state);

    this.expiring = false;
  }

  static async _load() {
    const tmp = await browser.storage.local.get("globalState");
    if (!("globalState" in tmp)) {
      return {
        patches: {},
        lastExpireCheck: Date.now(),
        expireDays: 30,
      };
    }

    return JSON.parse(tmp.globalState);
  }

  static async _save(state) {
    await browser.storage.local.set({
      globalState: JSON.stringify(state),
    });
  }
}
