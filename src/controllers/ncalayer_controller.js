import { Controller } from "stimulus"
import Client from "@seithq/ncalayer"

export default class extends Controller {
  static targets = ["error", "ui", "version", "path"]

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
      } else {
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

  browseKeyStore() {
    this.client.browseKeyStore("PKCS12", "P12", "", (data) => {
      this.targets.find("path").textContent = data.result
    })
  }
}
