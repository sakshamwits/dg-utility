# 🛒 ecom-ondc-order-sdk

A lightweight, plug-and-play SDK to handle core order-related logic for ONDC-compliant e-commerce platforms.

---

## ✨ Features

- 📦 ETA breach detection
- 🔁 Cancelability logic

---

## 📦 Installation

Install directly from this public GitHub repository:

```bash
npm install https://<YOUR_GITHUB_USERNAME>:<YOUR_PERSONAL_ACCESS_TOKEN>@github.com/navya-app/ecom-ondc-util-sdk

```
---

## 🧩 Usage

First, import the required functions in your project:

```js
const { isETABreached, isCancellable } = require("ecom-ondc-order-sdk");
