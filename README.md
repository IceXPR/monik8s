# moniK8s

<img width="1320" alt="Screenshot 2025-03-18 at 3 00 46 PM" src="https://github.com/user-attachments/assets/4ec8f8eb-6a98-407d-ae07-1028f85ac25b" />

## Install
Install chart on cluster
``` bash
helm install monik8s ./helm/k8s-metrics-dashboard --namespace monik8s --values ./helm/k8s-metrics-dashboard/values.yaml 
```

## Upgrade
``` bash
helm upgrade monik8s ./helm/k8s-metrics-dashboard --namespace monik8s --values ./helm/k8s-metrics-dashboard/values.yaml 
```

