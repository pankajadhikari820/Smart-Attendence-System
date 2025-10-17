// This file contains the logic for creating dynamic form templates for event registrations. 

document.addEventListener("DOMContentLoaded", () => {
    const fieldsList = document.getElementById("fieldsList");
    const newFieldType = document.getElementById("newFieldType");
    const newFieldLabel = document.getElementById("newFieldLabel");
    const addFieldBtn = document.getElementById("addFieldBtn");
    const saveTemplateBtn = document.getElementById("saveTemplateBtn");
    const loadTemplateBtn = document.getElementById("loadTemplateBtn");
    const tplName = document.getElementById("tplName");

    const fieldTypes = ["Text", "Email", "Number", "Select", "Checkbox"];
    fieldTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        newFieldType.appendChild(option);
    });

    addFieldBtn.addEventListener("click", () => {
        const fieldType = newFieldType.value;
        const fieldLabel = newFieldLabel.value.trim();
        if (fieldLabel) {
            const fieldDiv = document.createElement("div");
            fieldDiv.className = "field";
            fieldDiv.innerHTML = `<label>${fieldLabel}</label>`;
            if (fieldType === "Select") {
                const select = document.createElement("select");
                select.className = "input";
                fieldDiv.appendChild(select);
            } else if (fieldType === "Checkbox") {
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                fieldDiv.appendChild(checkbox);
            } else {
                const input = document.createElement("input");
                input.type = fieldType.toLowerCase();
                input.className = "input";
                fieldDiv.appendChild(input);
            }
            fieldsList.appendChild(fieldDiv);
            newFieldLabel.value = "";
        }
    });

    saveTemplateBtn.addEventListener("click", () => {
        const template = {
            name: tplName.value,
            fields: Array.from(fieldsList.children).map(field => {
                const label = field.querySelector("label").textContent;
                const type = field.querySelector("input, select").type || "select";
                return { label, type };
            })
        };
        localStorage.setItem(`formTemplate_${template.name}`, JSON.stringify(template));
        alert("Template saved!");
    });

    loadTemplateBtn.addEventListener("click", () => {
        const templateName = tplName.value;
        const template = JSON.parse(localStorage.getItem(`formTemplate_${templateName}`));
        if (template) {
            fieldsList.innerHTML = "";
            template.fields.forEach(field => {
                const fieldDiv = document.createElement("div");
                fieldDiv.className = "field";
                fieldDiv.innerHTML = `<label>${field.label}</label>`;
                const input = document.createElement("input");
                input.type = field.type.toLowerCase();
                input.className = "input";
                fieldDiv.appendChild(input);
                fieldsList.appendChild(fieldDiv);
            });
            alert("Template loaded!");
        } else {
            alert("Template not found!");
        }
    });
});