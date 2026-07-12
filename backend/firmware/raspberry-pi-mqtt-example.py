import json
import random
import time
import os

import paho.mqtt.client as mqtt

BROKER = os.getenv("MQTT_BROKER_HOST", "mqtt")
DEVICE_ID = "rpi-001"
MACHINE_ID = "M-103"
DEVICE_SECRET = "replace-with-device-shared-secret"

client = mqtt.Client(client_id=DEVICE_ID)
client.connect(BROKER, 1883, keepalive=60)

client.publish(
    "kavach/device/register",
    json.dumps(
        {
            "deviceId": DEVICE_ID,
            "machineId": MACHINE_ID,
            "deviceType": "Raspberry Pi",
            "firmwareVersion": "1.0.0",
            "deviceSecret": DEVICE_SECRET,
            "supportedSensors": ["temperature", "noise", "flowRate", "gasSensor"],
        }
    ),
    qos=1,
    retain=True,
)

while True:
    telemetry = {
        "deviceId": DEVICE_ID,
        "machineId": MACHINE_ID,
        "temperature": round(random.uniform(55, 72), 1),
        "noise": round(random.uniform(68, 88), 1),
        "flowRate": round(random.uniform(12, 18), 1),
        "gasSensor": round(random.uniform(120, 220), 1),
        "deviceSecret": DEVICE_SECRET,
    }
    client.publish(
        f"kavach/device/{DEVICE_ID}/telemetry",
        json.dumps(telemetry),
        qos=1,
    )
    time.sleep(2)
