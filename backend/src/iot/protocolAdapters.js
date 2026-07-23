class BaseProtocolAdapter {
  constructor(name) {
    this.name = name;
  }

  async connect() {
    return {
      connected: false,
      protocol: this.name,
      message: `${this.name} adapter is not configured`,
    };
  }

  async disconnect() {
    return {
      disconnected: true,
      protocol: this.name,
    };
  }

  async publish() {
    throw new Error(`${this.name} publish is not implemented`);
  }

  async subscribe() {
    throw new Error(`${this.name} subscribe is not implemented`);
  }
}

export class MqttProtocolAdapter extends BaseProtocolAdapter {
  constructor(clientManager) {
    super("MQTT");
    this.clientManager = clientManager;
  }

  async connect() {
    return this.clientManager.start();
  }

  async disconnect() {
    return this.clientManager.stop();
  }
}

export class RestDeviceApiAdapter extends BaseProtocolAdapter {
  constructor() {
    super("REST");
  }

  async connect() {
    return {
      connected: true,
      protocol: this.name,
      message: "REST device API is served by Express",
    };
  }
}

export class OpcUaProtocolAdapter extends BaseProtocolAdapter {
  constructor() {
    super("OPC_UA");
  }
}

export class ModbusTcpProtocolAdapter extends BaseProtocolAdapter {
  constructor() {
    super("MODBUS_TCP");
  }
}

export class ModbusRtuProtocolAdapter extends BaseProtocolAdapter {
  constructor() {
    super("MODBUS_RTU");
  }
}

export class BacnetProtocolAdapter extends BaseProtocolAdapter {
  constructor() {
    super("BACNET");
  }
}

export class PlcProtocolAdapter extends BaseProtocolAdapter {
  constructor() {
    super("PLC");
  }
}

export const createProtocolAdapters = (mqttClientManager) => ({
  BACNET: new BacnetProtocolAdapter(),
  MODBUS_RTU: new ModbusRtuProtocolAdapter(),
  MODBUS_TCP: new ModbusTcpProtocolAdapter(),
  MQTT: new MqttProtocolAdapter(mqttClientManager),
  OPC_UA: new OpcUaProtocolAdapter(),
  PLC: new PlcProtocolAdapter(),
  REST: new RestDeviceApiAdapter(),
});
