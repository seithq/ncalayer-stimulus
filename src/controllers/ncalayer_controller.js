import { Controller } from "stimulus"
import Client, { extractKeyAlias } from "@seithq/ncalayer"

export default class extends Controller {
  static targets = ["error", "ui", "version", "path", "password", "key-list", "not-before"]

  initialize() {}

  connect() {
    let ws = new WebSocket("wss://127.0.0.1:13579/")

    ws.onopen = (e) => {
      console.log("connection opened")
    }

    ws.onerror = (e) => {
      console.log("connection terminated")
      this.showError()
    }

    ws.onclose = (e) => {
      if (e.wasClean) {
        console.log("connection closed")
      } else {
        console.log("connection error: [code]=" + e.code + ", [reason]=" + e.reason)
      }
      this.showError()
    }

    this.client = new Client(ws)
    this.loadVersion()
  }

  disconnect() {
    this.client.close()
  }

  loadVersion() {
    const vPing = setInterval(() => {
      if (this.client.version !== "") {
        this.targets.find("version").textContent = this.client.version
        setTimeout(() => {
          clearInterval(vPing)
        }, 100)
      }
    }, 500)
  }

  reconnect(e) {
    window.location.reload()
  }

  showError() {
    this.targets.find("error").classList.remove("hidden")
    this.targets.find("ui").classList.add("hidden")
  }

  showUI() {
    this.targets.find("ui").classList.remove("hidden")
    this.targets.find("error").classList.add("hidden")
  }

  markAsRadioButton(element, isActive) {
    if (isActive) {
      element.classList.add("bg-teal-700", "text-white")
      element.classList.remove("bg-white", "text-teal-700")
    } else {
      element.classList.add("bg-white", "text-teal-700")
      element.classList.remove("bg-teal-700", "text-white")
    }
  }

  chooseKeyType(e) {
    this.data.set("keytype", e.target.dataset.keytype)
    const keyTypes = [...e.target.parentNode.getElementsByTagName("div")]
    keyTypes.forEach((element) => {
      this.markAsRadioButton(element, element.dataset.keytype === this.data.get("keytype"))
    })
  }

  setLocale(e) {
    this.data.set("locale", e.target.dataset.locale)

    const locales = [...e.target.parentNode.getElementsByTagName("div")]
    locales.forEach((element) => {
      this.markAsRadioButton(element, element.dataset.locale === this.data.get("locale"))
    })

    this.client.setLocale(this.data.get("locale"), (data) => {})
  }

  // NCALayer API

  browseKeyStore(e) {
    this.data.set("storage", e.target.value)
    this.client.browseKeyStore(e.target.value, "P12", "", (data) => {
      this.targets.find("path").value = data.getResult()
    })
  }

  getKeys() {
    this.client.getKeys(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.targets.find("password").value,
      this.data.get("keytype"),
      (data) => {
        const alias = extractKeyAlias(data.getResult())
        this.targets.find("key-list").append(new Option(data.getResult(), alias))
        this.data.set("alias", alias)
      }
    )
  }

  getNotBefore() {
    this.client.getNotBefore(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      (data) => {
        this.targets.find("not-before").value = data.getResult()
      }
    )
  }

  getNotAfter() {
    this.client.getNotAfter(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      (data) => {
        this.targets.find("not-after").value = data.getResult()
      }
    )
  }
}
