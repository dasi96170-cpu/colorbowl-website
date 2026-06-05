(function () {
    "use strict";

    const groupConfig = {
        base: { label: "主食", max: 2, hint: "可選 1 至 2 種" },
        protein: { label: "蛋白質", max: 2, hint: "最多 2 種" },
        topping: { label: "配菜", max: 5, hint: "最多 5 種" },
        sauce: { label: "醬汁", max: 1, hint: "選 1 種" },
        garnish: { label: "點綴", max: 1, hint: "選 1 種" },
        crispy: { label: "脆脆的", max: 1, hint: "選 1 種" },
        soup: { label: "湯品", max: 1, hint: "可選 1 種" }
    };

    const regionConfig = {
        north: { label: "北部", basePrice: 125 },
        centralSouth: { label: "中南部", basePrice: 115 }
    };

    const selected = new Map();
    const ingredients = new Map();
    let selectedRegion = "north";

    document.addEventListener("DOMContentLoaded", initBowlBuilder);

    function initBowlBuilder() {
        const anchor = document.querySelector(".sv_02");
        const menuRoot = document.querySelector(".sv_03");

        if (!anchor || !menuRoot || !window.nutritionDatabase) {
            return;
        }

        anchor.insertAdjacentHTML("afterend", renderBuilder());
        placeFloatingSummary(menuRoot);
        collectIngredients(menuRoot);
        bindBuilderActions();
        bindFloatingSummary(menuRoot);
        updateSummary();
        updateMenuStates();
    }

    function renderBuilder() {
        return `
            <section id="bowlCalculator" class="bowl-calculator bowl-builder" aria-label="彩碗點餐整理">
                <div class="bc-shell">
                    ${renderSummary("bc-panel bc-summary bc-summary--primary")}
                </div>
                <div class="bc-floating-summary" aria-live="polite">
                    ${renderSummary("bc-panel bc-summary bc-summary--floating")}
                </div>
            </section>
        `;
    }

    function placeFloatingSummary(menuRoot) {
        const floatingSummary = document.querySelector(".bc-floating-summary");
        if (!floatingSummary || !menuRoot.parentNode) return;

        const layout = document.createElement("div");
        const placeholder = document.createElement("div");

        layout.className = "bc-menu-layout";
        placeholder.className = "bc-floating-placeholder";
        placeholder.setAttribute("aria-hidden", "true");

        menuRoot.parentNode.insertBefore(layout, menuRoot);
        layout.appendChild(menuRoot);
        layout.appendChild(placeholder);
        document.body.appendChild(floatingSummary);
    }

    function renderSummary(className) {
        return `
            <aside class="${className}">
                <div class="bc-summary-head">
                    <div>
                        <span class="bc-summary-kicker">點餐整理</span>
                        <h3>目前選擇 <span class="bc-picked-count" data-bc-picked-count>0 項</span></h3>
                    </div>
                    <button class="bc-reset" type="button" data-bc-reset>清空</button>
                </div>
                <div class="bc-price-line">
                    <span>總價估算</span>
                    <strong data-bc-total="price">$0</strong>
                </div>
                <div class="bc-region-switch" role="group" aria-label="選擇價格地區">
                    ${Object.entries(regionConfig).map(([key, config]) => `
                        <button type="button" data-bc-region="${key}" class="${key === selectedRegion ? "is-active" : ""}">
                            <span>${config.label}</span>
                            <strong>$${config.basePrice} 起</strong>
                        </button>
                    `).join("")}
                </div>
                <div class="bc-price-breakdown">
                    <span data-bc-price-base>起始價 $125</span>
                    <span data-bc-price-addon>加購 $0</span>
                </div>
                <div class="bc-total-grid">
                    <div class="bc-total-card"><span>熱量</span><strong data-bc-total="calories">0 kcal</strong></div>
                    <div class="bc-total-card"><span>蛋白質</span><strong data-bc-total="protein">0 g</strong></div>
                    <div class="bc-total-card"><span>碳水</span><strong data-bc-total="carbs">0 g</strong></div>
                    <div class="bc-total-card"><span>脂肪</span><strong data-bc-total="fat">0 g</strong></div>
                </div>
                <div class="bc-selected-list" data-bc-selected>
                    <p class="bc-empty">還沒選食材。從下方菜單按「加入」開始整理你的彩碗。</p>
                </div>
            </aside>
        `;
    }

    function bindBuilderActions() {
        document.querySelectorAll("[data-bc-reset]").forEach((button) => {
            button.addEventListener("click", resetSelection);
        });
        document.querySelectorAll("[data-bc-region]").forEach((button) => {
            button.addEventListener("click", () => {
                const region = button.dataset.bcRegion;
                if (!region || !regionConfig[region]) return;
                selectedRegion = region;
                updateSummary();
                updateRegionButtons();
            });
        });
    }

    function bindFloatingSummary(menuRoot) {
        let ticking = false;

        const sync = () => {
            ticking = false;
            syncFloatingSummaryPosition();
            document.body.classList.add("bc-menu-active");
        };

        const requestSync = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(sync);
        };

        sync();
        window.addEventListener("scroll", requestSync, { passive: true });
        window.addEventListener("resize", requestSync);
    }

    function syncFloatingSummaryPosition() {
        const placeholder = document.querySelector(".bc-floating-placeholder");
        if (!placeholder || !window.matchMedia("(min-width: 900px)").matches) return;

        const rect = placeholder.getBoundingClientRect();
        const primary = document.querySelector(".bc-summary--primary");
        const primaryRect = primary?.getBoundingClientRect();
        const alignedTop = primaryRect ? Math.max(0, Math.round(primaryRect.top)) : 108;

        document.documentElement.style.setProperty("--bc-dock-left", `${Math.round(rect.left)}px`);
        document.documentElement.style.setProperty("--bc-dock-width", `${Math.round(rect.width)}px`);
        document.documentElement.style.setProperty("--bc-dock-top", `${alignedTop}px`);
    }

    function collectIngredients(menuRoot) {
        const tags = menuRoot.querySelectorAll(".sv_base h4, .sv_dishes b");

        tags.forEach((tag, index) => {
            const group = getGroup(tag);
            if (!group || !groupConfig[group]) return;

            const name = cleanIngredientName(tag.textContent || "");
            if (!name) return;

            const nutrition = findNutrition(name);
            const item = {
                id: `${group}-${index}`,
                group,
                name,
                label: getVisibleName(tag, name),
                image: nutrition.image || getIcon(tag),
                calories: toNumber(nutrition.calories),
                protein: toNumber(nutrition.protein),
                carbs: toNumber(nutrition.carbs),
                fat: toNumber(nutrition.fat),
                price: toNumber(nutrition.price),
                included: nutrition.included || ""
            };

            ingredients.set(item.id, item);
            tag.dataset.bcId = item.id;
            addIngredientButton(tag, item);
        });
    }

    function getGroup(tag) {
        const section = tag.closest(".sv_base, .sv_protein, .sv_topping, .sv_sauce, .sv_garnish");
        if (!section) return "";

        if (section.classList.contains("sv_base")) return "base";
        if (section.classList.contains("sv_protein")) return "protein";
        if (section.classList.contains("sv_topping")) return "topping";
        if (section.classList.contains("sv_sauce")) return "sauce";

        const subHeading = (tag.closest("dd")?.querySelector("h6")?.textContent || "").toLowerCase();
        if (subHeading.includes("crispy")) return "crispy";
        if (subHeading.includes("soup")) return "soup";
        return "garnish";
    }

    function addIngredientButton(tag, item) {
        const container = tag.closest("li") || tag.parentElement;
        if (!container || container.querySelector(`[data-bc-button="${item.id}"]`)) return;

        container.classList.add("bc-selectable-item");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "bc-add-button";
        button.dataset.bcButton = item.id;
        button.setAttribute("aria-label", `加入 ${item.label}`);
        button.innerHTML = "<span>加入</span>";
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleItem(item.id);
        });

        if (item.group === "base") {
            const title = container.querySelector("h3");
            const price = createVisiblePrice(item);
            if (title) {
                title.insertAdjacentElement("afterend", price);
                price.insertAdjacentElement("afterend", button);
            } else {
                container.appendChild(price);
                container.appendChild(button);
            }
            return;
        }

        let actionRow = container.querySelector(":scope > .bc-action-row");
        if (!actionRow) {
            actionRow = document.createElement("div");
            actionRow.className = "bc-action-row";

            const price = container.querySelector(":scope > strong");
            if (price) actionRow.appendChild(price);
            container.appendChild(actionRow);
        }

        let price = actionRow.querySelector(":scope > .bc-visible-price") || actionRow.querySelector(":scope > strong");
        if (!price) {
            price = document.createElement("strong");
            actionRow.insertBefore(price, actionRow.firstChild);
        }
        price.classList.add("bc-visible-price");
        price.classList.toggle("is-included", item.price === 0);
        price.textContent = formatVisiblePrice(item);

        actionRow.appendChild(button);
    }

    function createVisiblePrice(item) {
        const price = document.createElement("strong");
        price.className = "bc-visible-price";
        price.classList.toggle("is-included", item.price === 0);
        price.textContent = formatVisiblePrice(item);
        return price;
    }

    function formatVisiblePrice(item) {
        if (item.price > 0) return `加購 +$${Math.round(item.price)}`;
        return item.included === "是" ? "基本價內" : "加購 $0";
    }

    function toggleItem(id) {
        const item = ingredients.get(id);
        if (!item) return;

        const groupItems = selected.get(item.group) || [];
        const exists = groupItems.includes(id);
        const limit = groupConfig[item.group].max;

        if (exists) {
            selected.set(item.group, groupItems.filter((itemId) => itemId !== id));
            showMessage("");
        } else if (limit === 1) {
            selected.set(item.group, [id]);
            showMessage(`${groupConfig[item.group].label}已改為「${item.label}」。`);
        } else if (groupItems.length < limit) {
            selected.set(item.group, [...groupItems, id]);
            showMessage("");
        } else {
            showMessage(`${groupConfig[item.group].label}最多選 ${limit} 種。`);
            return;
        }

        updateSummary();
        updateMenuStates();
    }

    function resetSelection() {
        selected.clear();
        showMessage("已清空目前選擇。");
        updateSummary();
        updateMenuStates();
    }

    function updateSummary() {
        const pickedItems = getPickedItems();
        const region = getSelectedRegionConfig();
        const totals = pickedItems.reduce((sum, item) => {
            const multiplier = getItemMultiplier(item);
            sum.calories += item.calories * multiplier;
            sum.protein += item.protein * multiplier;
            sum.carbs += item.carbs * multiplier;
            sum.fat += item.fat * multiplier;
            sum.price += item.price * multiplier;
            return sum;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0, price: 0 });
        const addonPrice = Math.round(totals.price);
        const totalPrice = region.basePrice + addonPrice;

        setText("[data-bc-picked-count]", `${pickedItems.length} 項`);
        setText("[data-bc-total='price']", `$${totalPrice}`);
        setText("[data-bc-price-base]", `${region.label}起始價 $${region.basePrice}`);
        setText("[data-bc-price-addon]", `加購 $${addonPrice}`);
        setText("[data-bc-total='calories']", `${Math.round(totals.calories)} kcal`);
        setText("[data-bc-total='protein']", `${formatGram(totals.protein)} g`);
        setText("[data-bc-total='carbs']", `${formatGram(totals.carbs)} g`);
        setText("[data-bc-total='fat']", `${formatGram(totals.fat)} g`);

        updateSelectedList(pickedItems);
        updateCounts();
        updateRegionButtons();
    }

    function updateSelectedList(pickedItems) {
        if (!pickedItems.length) {
            setHtml("[data-bc-selected]", '<p class="bc-empty">還沒選食材。從下方菜單按「加入」開始整理你的彩碗。</p>');
            document.dispatchEvent(new CustomEvent("colorbowl:summary-updated"));
            return;
        }

        const html = Object.entries(groupConfig).map(([group, config]) => {
            const items = pickedItems.filter((item) => item.group === group);
            if (!items.length) return "";

            return `
                <div class="bc-selected-group">
                    <strong>${config.label}</strong>
                    <div>
                        ${items.map((item) => `
                            <span class="bc-chip">
                                <span class="bc-chip-target" data-ingredient-tooltip="${escapeHtml(item.name)}">
                                    ${item.image ? `<img src="${item.image}" alt="">` : ""}
                                    ${escapeHtml(item.label)}${getItemMultiplier(item) === 0.5 ? "（各半）" : ""}
                                </span>
                            </span>
                        `).join("")}
                    </div>
                </div>
            `;
        }).join("");

        setHtml("[data-bc-selected]", html);
        document.dispatchEvent(new CustomEvent("colorbowl:summary-updated"));
    }

    function updateCounts() {
        Object.keys(groupConfig).forEach((group) => {
            const count = (selected.get(group) || []).length;
            setText(`[data-bc-count="${group}"]`, ` ${count}/${groupConfig[group].max}`);
        });
    }

    function updateRegionButtons() {
        document.querySelectorAll("[data-bc-region]").forEach((button) => {
            button.classList.toggle("is-active", button.dataset.bcRegion === selectedRegion);
        });
    }

    function updateMenuStates() {
        ingredients.forEach((item, id) => {
            const button = document.querySelector(`[data-bc-button="${id}"]`);
            const tag = document.querySelector(`[data-bc-id="${id}"]`);
            const isSelected = (selected.get(item.group) || []).includes(id);
            const groupItems = selected.get(item.group) || [];
            const isFull = groupItems.length >= groupConfig[item.group].max && !isSelected && groupConfig[item.group].max > 1;

            if (button) {
                button.classList.toggle("is-selected", isSelected);
                button.classList.toggle("is-disabled", isFull);
                button.innerHTML = isSelected ? "<span>已選</span>" : "<span>加入</span>";
                button.disabled = isFull;
            }

            tag?.closest("li")?.classList.toggle("bc-item-selected", isSelected);
        });
    }

    function copyOrder() {
        const pickedItems = getPickedItems();
        if (!pickedItems.length) {
            showMessage("還沒有可複製的點餐內容。");
            return;
        }

        const lines = ["我想點一碗彩碗："];
        const region = getSelectedRegionConfig();
        const addonPrice = Math.round(pickedItems.reduce((sum, item) => sum + item.price * getItemMultiplier(item), 0));
        lines.push(`地區：${region.label}`);
        Object.entries(groupConfig).forEach(([group, config]) => {
            const names = pickedItems
                .filter((item) => item.group === group)
                .map((item) => `${item.label}${getItemMultiplier(item) === 0.5 ? "（各半）" : ""}`);
            if (names.length) lines.push(`${config.label}：${names.join("、")}`);
        });
        lines.push(`總價估算：$${region.basePrice + addonPrice}（${region.label}起始價 $${region.basePrice} + 加購 $${addonPrice}）`);

        const text = lines.join("\n");
        writeClipboard(text)
            .then(() => showMessage("已複製點餐內容。"))
            .catch(() => showMessage("瀏覽器無法自動複製，請手動選取目前選擇。"));
    }

    function writeClipboard(text) {
        if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);

        return new Promise((resolve, reject) => {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            const ok = document.execCommand("copy");
            textarea.remove();
            ok ? resolve() : reject(new Error("copy failed"));
        });
    }

    function getPickedItems() {
        return Array.from(selected.values())
            .flat()
            .map((id) => ingredients.get(id))
            .filter(Boolean);
    }

    function getItemMultiplier(item) {
        const groupItems = selected.get(item.group) || [];
        if (item.group === "base" && groupItems.length === 2) return 0.5;
        return 1;
    }

    function getSelectedRegionConfig() {
        return regionConfig[selectedRegion] || regionConfig.north;
    }

    function findNutrition(name) {
        const database = window.nutritionDatabase || {};
        if (database[name]) return database[name];

        for (const key in database) {
            if (name.includes(key) || key.includes(name)) return database[key];
        }

        return {};
    }

    function cleanIngredientName(text) {
        return text.replace(/[^\u4e00-\u9fa5A-Za-z0-9()]/g, "").trim();
    }

    function getVisibleName(tag, cleanName) {
        const clone = tag.cloneNode(true);
        clone.querySelectorAll("img, u").forEach((el) => el.remove());
        return (clone.textContent || cleanName).replace(/\s+/g, " ").trim() || cleanName;
    }

    function getIcon(tag) {
        return tag.querySelector("img")?.getAttribute("src") || "";
    }

    function toNumber(value) {
        const match = String(value || "").match(/-?\d+(\.\d+)?/);
        return match ? Number(match[0]) : 0;
    }

    function formatGram(value) {
        return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function showMessage(message) {
        return;
    }

    function setText(selector, text) {
        document.querySelectorAll(selector).forEach((element) => {
            element.textContent = text;
        });
    }

    function setHtml(selector, html) {
        document.querySelectorAll(selector).forEach((element) => {
            element.innerHTML = html;
        });
    }
})();
