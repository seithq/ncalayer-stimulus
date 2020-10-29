import { Controller } from "stimulus"
import Client, { extractKeyAlias } from "@seithq/ncalayer"

const defaultXML = `<?xml version="1.0" encoding="utf-8"?>
<root>
  <name>Ivan</name>
  <iin>123456789012</iin>
</root>
`

const defaultXMLByElementId = `<?xml version="1.0" encoding="utf-8"?>
<root>
    <person id="personId">
      <name>Ivan</name>
      <iin>123456789012</iin>
    </person>
    <company id="companyId">
      <name>Company Name</name>
      <bin>123456789012</bin>
    </company>
</root>
`

export default class extends Controller {
  static targets = [
    "error",
    "ui",
    "version",
    "path",
    "password",
    "key-list",
    "not-before",
    "subject-dn",
    "issuer-dn",
    "rdn",
    "plain-data",
    "signed-plain-data",
    "check-data",
    "cms-signature",
    "cms-attachment",
    "signed-cms-signature",
    "check-cms-signature",
    "cms-signature-file-path",
    "cms-file-attachment",
    "signed-cms-signature-file",
    "check-cms-signature-file",
    "xml",
    "signed-xml",
    "check-xml",
  ]

  initialize() {
    this.targets.find("xml").value = defaultXML
  }

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

  get oid() {
    return parseInt(this.data.get("oid"))
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

  markAsValidated(element, isValid) {
    element.classList.remove("text-orange-600", "border-orange-600", "bg-orange-200")

    if (isValid) {
      element.classList.add("text-green-600", "border-green-600", "bg-green-200")
      element.classList.remove("text-red-600", "border-red-600", "bg-red-200")
      element.textContent = "Валидная подпись"
    } else {
      element.classList.add("text-red-600", "border-red-600", "bg-red-200")
      element.classList.remove("text-green-600", "border-green-600", "bg-green-200")
      element.textContent = "Неправильная подпись"
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

  chooseOID(e) {
    this.data.set("oid", e.target.dataset.oid)
    const oids = [...e.target.parentNode.parentNode.querySelectorAll("[data-oid]")]
    oids.forEach((element) => {
      this.markAsRadioButton(element, element.dataset.oid === this.data.get("oid"))
    })
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

  getSubjectDN() {
    this.client.getSubjectDN(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      (data) => {
        this.targets.find("subject-dn").value = data.getResult()
      }
    )
  }

  getIssuerDN() {
    this.client.getIssuerDN(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      (data) => {
        this.targets.find("issuer-dn").value = data.getResult()
      }
    )
  }

  getRdnByOid() {
    this.client.getRdnByOid(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      this.data.get("oid"),
      0,
      (data) => {
        this.targets.find("rdn").value = data.getResult()
      }
    )
  }

  signPlainData() {
    this.client.signPlainData(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      this.targets.find("plain-data").value,
      (data) => {
        this.targets.find("signed-plain-data").value = data.getResult()
      }
    )
  }

  verifyPlainData() {
    this.client.verifyPlainData(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      this.targets.find("plain-data").value,
      this.targets.find("signed-plain-data").value,
      (data) => {
        this.markAsValidated(this.targets.find("check-data"), data.getResult())
      }
    )
  }

  createCMSSignature() {
    this.client.createCMSSignature(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      this.targets.find("cms-signature").value,
      this.targets.find("cms-attachment").checked,
      (data) => {
        this.targets.find("signed-cms-signature").value = data.getResult()
      }
    )
  }

  verifyCMSSignature() {
    this.client.verifyCMSSignature(
      this.targets.find("cms-signature").value,
      this.targets.find("signed-cms-signature").value,
      (data) => {
        this.markAsValidated(this.targets.find("check-cms-signature"), data.getResult())
      }
    )
  }

  showFileChooser() {
    this.client.showFileChooser("ALL", "", (data) => {
      this.targets.find("cms-signature-file-path").value = data.getResult()
    })
  }

  createCMSSignatureFromFile() {
    this.client.createCMSSignatureFromFile(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      this.targets.find("cms-signature-file-path").value,
      this.targets.find("cms-file-attachment").checked,
      (data) => {
        this.targets.find("signed-cms-signature-file").value = data.getResult()
      }
    )
  }

  verifyCMSSignatureFromFile() {
    this.client.verifyCMSSignatureFromFile(
      this.targets.find("cms-signature-file-path").value,
      this.targets.find("signed-cms-signature-file").value,
      (data) => {
        this.markAsValidated(this.targets.find("check-cms-signature-file"), data.getResult())
      }
    )
  }

  signXml() {
    this.client.signXml(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
      this.targets.find("xml").value,
      (data) => {
        this.targets.find("signed-xml").value = data.getResult()
      }
    )
  }

  verifyXml() {
    this.client.verifyXml(this.targets.find("signed-xml").value, (data) => {
      this.markAsValidated(this.targets.find("check-xml"), data.getResult())
    })
  }
}
