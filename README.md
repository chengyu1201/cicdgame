# CI/CD Game — Quick Start

1. 前端：到網頁輸入 **9 碼學號** → 送出  
2. 後端：建立 `submission-<sid>-<ts>` 分支、在 `submissions/<sid>.txt` 建檔、開 PR  
3. CI（cloudbuild.yaml）：針對符合的分支 **build & push** 映像到 Artifact Registry  
4. **組員手動**：在 Cloud Build 觸發 `cloudbuild-deploy.yaml` 的 Manual Trigger → Deploy 到 Cloud Run(asia-east1)

> GitHub PAT（repo 權限）請放到 Cloud Build 的 Secret Manager，部署時以環境變數 `GITHUB_TOKEN` 供 Cloud Run 容器使用。
