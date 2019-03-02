class Phabrinter {
  constructor() {
    this.init();
  }

  async init() {
    this.removeOldElements();

    if (!this.getPatchName()) {
      return;
    }

    this.expiring = false;

    const filesTable = document.getElementsByClassName("aphront-table-view")[0];
    const filesTbody = filesTable.getElementsByTagName("tbody")[0];
    const headerRow = filesTbody.getElementsByTagName("tr")[0];

    this.currentFile = null;
    this.addReviewedColumn(headerRow);
    this.files = this.collectFiles(filesTbody, headerRow);
    this.addReviewedAndCollapsed();
    this.allFiles = this.addAllFilesLink(filesTbody, headerRow);

    await this.loadReviewedState();

    this.hookLinks();

    this.setCurrent(this.allFiles);
  }

  // Remove existing elements that's added by older version.
  removeOldElements() {
    for (const node of [...document.getElementsByClassName("phabrinter-generated")]) {
      node.remove();
    }
  }

  getPatchName() {
    const m = document.location.href.match(/\/(D[0-9]+)/);
    if (!m) {
      return false;
    }
    this.patchName = m[1];
    return true;
  }

  addReviewedColumn(headerRow) {
    const pathCell = headerRow.getElementsByClassName("differential-toc-file")[0];

    const reviewedCell = document.createElement("th");
    reviewedCell.classList.add("phabrinter-generated");
    reviewedCell.textContent = "Reviewed";
    pathCell.parentNode.insertBefore(reviewedCell, pathCell);
  }

  collectFiles(filesTbody, headerRow) {
    const files = [];

    const diffs = document.getElementsByClassName("differential-changeset");

    let i = 0;
    for (const row of filesTbody.getElementsByTagName("tr")) {
      if (row === headerRow) {
        continue;
      }

      const originalLink = row.getElementsByTagName("a")[0];
      if (!originalLink) {
        continue;
      }

      const linkCell = this.findParentNode(originalLink, "td");

      const name = originalLink.textContent;

      // Because the link has event listner, create our own link.
      const link = document.createElement("a");
      link.classList.add("phabrinter-generated");
      link.classList.add("phabrinter-link");
      link.textContent = name;

      originalLink.parentNode.insertBefore(link, originalLink);
      originalLink.style.display = "none";

      const diff = diffs[i];
      const diffContent = diff.getElementsByClassName("changeset-view-content")[0];
      const diffButtons = diff.getElementsByClassName("differential-changeset-buttons")[0];
      const diffHeader = diff.getElementsByTagName("h1")[0];

      files.push({
        i,
        name,
        row,
        link,
        linkCell,
        diff,
        diffContent,
        diffButtons,
        diffHeader,
        reviewed: false,
        collapsed: false,
      });
      i++;
    }

    return files;
  }

  findParentNode(node, nodeName) {
    while (node && node != document.body) {
      if (node.nodeName.toLowerCase() == nodeName) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  addReviewedAndCollapsed() {
    for (const file of this.files) {
      {
        const reviewedCell = document.createElement("td");
        reviewedCell.classList.add("phabrinter-generated");
        reviewedCell.classList.add("phabrinter-reviewed-cell");
        file.row.insertBefore(reviewedCell, file.linkCell);

        const reviewedCheckbox = document.createElement("input");
        reviewedCheckbox.type = "checkbox";
        reviewedCell.appendChild(reviewedCheckbox);

        file.reviewedCheckbox = reviewedCheckbox;
      }

      {
        const reviewedBox = document.createElement("div");
        reviewedBox.classList.add("phabrinter-generated");
        reviewedBox.classList.add("phabrinter-reviewed-box");
        file.diffButtons.parentNode.insertBefore(reviewedBox,
                                                 file.diffButtons.nextSibling);

        const collapsedButton = document.createElement("div");
        collapsedButton.classList.add("phabrinter-collapsed-button");
        collapsedButton.textContent = "[-]";
        reviewedBox.appendChild(collapsedButton);
        file.collapsedButton = collapsedButton;
        file.collapsedButton.addEventListener("click", () => {
          file.collapsed = !file.collapsed;
          this.updateCollapsed(file);
        });

        const reviewedCheckbox = document.createElement("input");
        reviewedCheckbox.id = `phabrinter-diff-reviewed-${file.i}`;
        reviewedCheckbox.type = "checkbox";
        reviewedBox.appendChild(reviewedCheckbox);

        const reviewedLabel = document.createElement("label");
        reviewedLabel.setAttribute("for", `phabrinter-diff-reviewed-${file.i}`);
        reviewedLabel.textContent = "Reviewed";
        reviewedBox.appendChild(reviewedLabel);

        file.diffReviewedCheckbox = reviewedCheckbox;
      }
    }
  }

  addAllFilesLink(filesTbody, headerRow) {
    const row = document.createElement("tr");
    row.classList.add("phabrinter-generated");
    row.classList.add("alt");

    const charCell = document.createElement("td");
    row.appendChild(charCell);

    const propCell = document.createElement("td");
    row.appendChild(propCell);

    const ftypeCell = document.createElement("td");
    row.appendChild(ftypeCell);

    const reviewedCell = document.createElement("td");
    row.appendChild(reviewedCell);

    const fileCell = document.createElement("td");
    row.appendChild(fileCell);

    const link = document.createElement("a");
    link.classList.add("phabrinter-link");
    const name = "All Files";
    link.textContent = name;
    fileCell.appendChild(link);

    const packageCell = document.createElement("td");
    row.appendChild(packageCell);

    filesTbody.insertBefore(row, headerRow.nextSibling);

    return {
      name,
      row,
      link,
    };
  }

  setCurrent(currentFile) {
    this.currentFile = currentFile;

    for (const file of [this.allFiles, ...this.files]) {
      if (file === currentFile) {
        file.link.classList.add("phabrinter-link-current");
      } else {
        file.link.classList.remove("phabrinter-link-current");
      }
    }

    if (this.currentFile === this.allFiles) {
      for (const file of this.files) {
        file.diff.classList.remove("phabrinter-diff-collapsed");
      }
    } else {
      for (const file of this.files) {
        if (file == this.currentFile) {
          file.diff.classList.remove("phabrinter-diff-collapsed");
        } else {
          file.diff.classList.add("phabrinter-diff-collapsed");
        }
      }
    }
  }

  updateReviewed(file, { save=true } = {}) {
    file.diffReviewedCheckbox.checked = file.reviewed;
    file.reviewedCheckbox.checked = file.reviewed;

    if (file.reviewed) {
      file.link.classList.add("phabrinter-link-reviewed");
    } else {
      file.link.classList.remove("phabrinter-link-reviewed");
    }

    if (save) {
      this.saveState();
    }
  }

  updateCollapsed(file, { save=true } = {}) {
    file.collapsedButton.textContent = file.collapsed ? "[+]" : "[-]";

    if (file.collapsed) {
      file.diffContent.classList.add("phabrinter-diff-content-collapsed");
    } else {
      file.diffContent.classList.remove("phabrinter-diff-content-collapsed");
    }

    if (save) {
      this.saveState();
    }
  }

  hookLinks() {
    this.allFiles.link.addEventListener("click", event => {
      this.setCurrent(this.allFiles);
      event.preventDefault();
    });

    for (const file of this.files) {
      file.link.addEventListener("click", event => {
        this.setCurrent(file);
        event.preventDefault();
      });

      file.reviewedCheckbox.addEventListener("change", event => {
        file.reviewed = file.reviewedCheckbox.checked;
        this.updateReviewed(file);
      });

      file.diffReviewedCheckbox.addEventListener("change", event => {
        file.reviewed = file.diffReviewedCheckbox.checked;
        this.updateReviewed(file);
      });
    }
  }

  async loadReviewedState() {
    const reviewedState = await GlobalState.loadPatch(this.patchName);
    if (!reviewedState) {
      return;
    }

    const filesMap = {};
    for (const file of this.files) {
      filesMap[file.name] = file;
    }
    for (const item of reviewedState) {
      if (item.name in filesMap) {
        const file = filesMap[item.name];
        file.reviewed = item.reviewed;
        file.collapsed = !!item.collapsed;
        this.updateReviewed(file, { save: false });
        this.updateCollapsed(file, { save: false });
      }
    }
  }

  async saveState() {
    const reviewedState = this.files.map(file => ({
      name: file.name,
      reviewed: file.reviewed,
      collapsed: file.collapsed,
    }));

    await GlobalState.addPatch(this.patchName, reviewedState);
  }
};
new Phabrinter();
