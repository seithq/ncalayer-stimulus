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

    "api-result",
    "api-second-result",
    "api-error-code",
    "api-error-message",

    "path",
    "password",
    "key-list",

    "not-before",
    "not-after",

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

    "xml-node",
    "xml-node-element",
    "xml-node-attribute",
    "xml-node-root",
    "signed-xml-node",
    "xml-node-attribute-check",
    "xml-node-root-check",
    "check-xml-node",

    "algorithm",
    "hash-data",
    "hash",
  ]

  initialize() {
    this.targets.find("xml").value = defaultXML
    this.targets.find("xml-node").value = defaultXMLByElementId
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

  secureFields() {
    return [
      this.data.get("storage"),
      this.targets.find("path").value,
      this.data.get("alias"),
      this.targets.find("password").value,
    ]
  }

  clearApiResponse() {
    this.targets.find("api-result").value = ""
    this.targets.find("api-second-result").value = ""
    this.targets.find("api-error-code").value = ""
    this.targets.find("api-error-message").value = ""
  }

  showApiResponse(data) {
    this.targets.find("api-result").value = data.getResult()
    this.targets.find("api-second-result").value = data.getSecondResult()
    this.targets.find("api-error-code").value =
      data.getErrorCode() === "NONE" ? "" : data.getErrorCode()

    if (!data.isOk()) this.targets.find("api-error-message").value = this.getErrorMessage(data)
  }

  getErrorMessage(data) {
    if (data.isPasswordAttemptsError()) {
      return "Неправильный пароль! Количество оставшихся попыток: " + this.getResult()
    }

    if (data.isPasswordError()) {
      return "Неправильный пароль!"
    }

    if (data.isKeyTypeError()) {
      return "Ключи не найдены. Попробуйте выбрать другой тип ключа"
    }

    if (data.isRdnNotFoundError()) {
      return "Ключ не содержит данный параметр"
    }

    if (data.isXmlParseError()) {
      return "Неверный формат XML"
    }

    if (data.isSignatureValidationError()) {
      return "Ошибка валидации подписи"
    }

    if (data.isKeyStoreError()) {
      return "Хранилище ключа не установлено"
    }

    if (data.isUnknownStorageError()) {
      return "Неверный или пустой тип хранилища"
    }

    if (data.isFileReadError()) {
      return "Ошибка чтения файла"
    }

    if (data.isCommonError()) {
      return "Общая ошибка"
    }

    return ""
  }

  // NCALayer API

  browseKeyStore(e) {
    this.data.set("storage", e.target.value)
    this.clearApiResponse()
    this.client.browseKeyStore(e.target.value, "P12", "", (data) => {
      this.showApiResponse(data)
      if (data.isOk()) this.targets.find("path").value = data.getResult()
    })
  }

  getKeys() {
    this.clearApiResponse()
    this.client.getKeys(
      this.data.get("storage"),
      this.targets.find("path").value,
      this.targets.find("password").value,
      this.data.get("keytype"),
      (data) => {
        this.showApiResponse(data)
        if (data.isOk()) {
          const alias = extractKeyAlias(data.getResult())
          this.targets.find("key-list").append(new Option(data.getResult(), alias))
          this.data.set("alias", alias)
        }
      }
    )
  }

  getNotBefore() {
    this.clearApiResponse()
    this.client.getNotBefore(...this.secureFields(), (data) => {
      this.showApiResponse(data)
      if (data.isOk()) this.targets.find("not-before").value = data.getResult()
    })
  }

  getNotAfter() {
    this.clearApiResponse()
    this.client.getNotAfter(...this.secureFields(), (data) => {
      this.showApiResponse(data)
      if (data.isOk()) this.targets.find("not-after").value = data.getResult()
    })
  }

  getSubjectDN() {
    this.clearApiResponse()
    this.client.getSubjectDN(...this.secureFields(), (data) => {
      this.showApiResponse(data)
      if (data.isOk()) this.targets.find("subject-dn").value = data.getResult()
    })
  }

  getIssuerDN() {
    this.clearApiResponse()
    this.client.getIssuerDN(...this.secureFields(), (data) => {
      this.showApiResponse(data)
      if (data.isOk()) this.targets.find("issuer-dn").value = data.getResult()
    })
  }

  getRdnByOid() {
    this.clearApiResponse()
    this.client.getRdnByOid(...this.secureFields(), this.data.get("oid"), 0, (data) => {
      this.showApiResponse(data)
      if (data.isOk()) this.targets.find("rdn").value = data.getResult()
    })
  }

  signPlainData() {
    this.clearApiResponse()
    this.client.signPlainData(
      ...this.secureFields(),
      this.targets.find("plain-data").value,
      (data) => {
        this.showApiResponse(data)
        if (data.isOk()) this.targets.find("signed-plain-data").value = data.getResult()
      }
    )
  }

  verifyPlainData() {
    this.clearApiResponse()
    this.client.verifyPlainData(
      ...this.secureFields(),
      this.targets.find("plain-data").value,
      this.targets.find("signed-plain-data").value,
      (data) => {
        this.showApiResponse(data)
        this.markAsValidated(this.targets.find("check-data"), data.isOk() && data.getResult())
      }
    )
  }

  createCMSSignature() {
    this.clearApiResponse()
    this.client.createCMSSignature(
      ...this.secureFields(),
      this.targets.find("cms-signature").value,
      this.targets.find("cms-attachment").checked,
      (data) => {
        this.showApiResponse(data)
        if (data.isOk()) this.targets.find("signed-cms-signature").value = data.getResult()
      }
    )
  }

  verifyCMSSignature() {
    this.clearApiResponse()
    this.client.verifyCMSSignature(
      this.targets.find("cms-signature").value,
      this.targets.find("signed-cms-signature").value,
      (data) => {
        this.showApiResponse(data)
        this.markAsValidated(
          this.targets.find("check-cms-signature"),
          data.isOk() && data.getResult()
        )
      }
    )
  }

  showFileChooser() {
    this.clearApiResponse()
    this.client.showFileChooser("ALL", "", (data) => {
      this.showApiResponse(data)
      if (data.isOk()) this.targets.find("cms-signature-file-path").value = data.getResult()
    })
  }

  createCMSSignatureFromFile() {
    this.clearApiResponse()
    this.client.createCMSSignatureFromFile(
      ...this.secureFields(),
      this.targets.find("cms-signature-file-path").value,
      this.targets.find("cms-file-attachment").checked,
      (data) => {
        this.showApiResponse(data)
        if (data.isOk()) this.targets.find("signed-cms-signature-file").value = data.getResult()
      }
    )
  }

  verifyCMSSignatureFromFile() {
    this.clearApiResponse()
    this.client.verifyCMSSignatureFromFile(
      this.targets.find("cms-signature-file-path").value,
      this.targets.find("signed-cms-signature-file").value,
      (data) => {
        this.showApiResponse(data)
        this.markAsValidated(
          this.targets.find("check-cms-signature-file"),
          data.isOk() && data.getResult()
        )
      }
    )
  }

  signXml() {
    this.clearApiResponse()
    this.client.signXml(...this.secureFields(), this.targets.find("xml").value, (data) => {
      this.showApiResponse(data)
      if (data.isOk()) this.targets.find("signed-xml").value = data.getResult()
    })
  }

  verifyXml() {
    this.clearApiResponse()
    this.client.verifyXml(this.targets.find("signed-xml").value, (data) => {
      this.showApiResponse(data)
      this.markAsValidated(this.targets.find("check-xml"), data.isOk() && data.getResult())
    })
  }

  signXmlByElementId() {
    this.clearApiResponse()
    this.client.signXmlByElementId(
      ...this.secureFields(),
      this.targets.find("xml-node").value,
      this.targets.find("xml-node-element").value,
      this.targets.find("xml-node-attribute").value,
      this.targets.find("xml-node-root").value,
      (data) => {
        this.showApiResponse(data)
        if (data.isOk()) this.targets.find("signed-xml-node").value = data.getResult()
      }
    )
  }

  verifyXmlByElementId() {
    this.clearApiResponse()
    this.client.verifyXmlByElementId(
      this.targets.find("signed-xml-node").value,
      this.targets.find("xml-node-attribute-check").value,
      this.targets.find("xml-node-root-check").value,
      (data) => {
        this.showApiResponse(data)
        this.markAsValidated(this.targets.find("check-xml-node"), data.isOk() && data.getResult())
      }
    )
  }

  getHash() {
    this.clearApiResponse()
    this.client.getHash(
      this.targets.find("hash-data").value,
      this.targets.find("algorithm").value,
      (data) => {
        this.showApiResponse(data)
        if (data.isOk()) this.targets.find("hash").value = data.getResult()
      }
    )
  }
}
