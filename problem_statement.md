# PID: 1670

## Problem Statement Title

Develop a functional solution that incorporates the security of the ML model.

## Description

### 1. Background

UIDAI is exploring possibilities to enable Face authentication on the desktop in a browser context.

The proposed architecture to provide Face Authentication in the browser context requires AI on the edge to perform a liveness check of the face being captured by the webcam or connected camera.

UIDAI is considering the injection of an ML model by using an appropriate binary code delivery mechanism.

The security of these models is important for transaction integrity and therefore seeks an innovative solution that will protect the model from any tampering and reverse engineering.

### 2. Problem Description

As part of the challenge, participating teams are to demonstrate model security in a browser context by using either obfuscation or cryptography.

Models are typically 5~7MB in size and structured as flatbuffers.

These models would be downloaded when first accessed on a desktop and then cached in the browser context.

For subsequent face authentication transactions, a cached model would be preferred unless the model has changed or been updated.

To solve the above problem statement, teams are free to choose either ONNX web runtime or Tensor.js or any other innovative model to distribute the model in the browser context.

#### Functional Objectives

1. **Model Security:** The solution must provide a mechanism to protect the model from any reverse engineering or tampering.
2. **Model Size Optimization:** The solution must not significantly increase the size of the model post-implementation of security frameworks. Models are expected to be downloaded in 3G/4G/5G wireless networks, and any increase in size may lead to a deteriorated user experience.
3. **Backend Components:** The solution must feature backend components to prepare the ML model either using obfuscation or cryptography. The backend activity can be a one-time task during the release of the ML models or a just-in-time approach. In the just-in-time approach, the model would be obfuscated or encrypted before being downloaded to the end user’s desktop.

### 3. Expected Solution

The expected outcome of this project is a functional solution that incorporates the security of the ML model at the edge. The backend for the proposed solution system must be designed to handle the high volume of transactions expected for any population-scale solutions.