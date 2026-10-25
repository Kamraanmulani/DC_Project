# ♟️ Distributed Computing (DC) Lab Experiments (2, 3, 4, 5, 6, 7, 8, 9, 10 & 11): ChessMate

**Subject**: Distributed Computing (Sem 7)  
**Faculty**: Prof. Dhanashree Tamhane  
**Project**: **ChessMate** (Distributed Multiplayer Chess Platform)  
**Technology Stack**: Python 3.10, gRPC, Protocol Buffers (proto3), Lamport Logical Clocks, Ricart-Agrawala Mutual Exclusion, Wait-For Graph Deadlock Detection, Least Connections Load Balancing, Gossip Replication & Last-Write-Wins (LWW), Redis Cache-Aside Fault Tolerance, Raft Consensus Leader Election & Failover, Kubernetes Container Orchestration, Headless Services, Distributed File System (DFS), Chunking & Replication, python-chess  

> 📖 **Comprehensive In-Depth Guide & Viva Q&A**: See [EXPERIMENTS_2_TO_11_README.md](EXPERIMENTS_2_TO_11_README.md) for full architectural breakdowns, mathematical proofs, diagrams, and top 60 viva questions.

---

## 📌 Summary of Implemented Experiments

| Exp # | Experiment Title | Key Mechanism | Files |
|:---:|:---|:---|:---|
| **2** | **RPC APIs Between Services** | gRPC over HTTP/2, Protobuf binary serialization | [`proto/chess.proto`](proto/chess.proto), [`chess_server.py`](chess_server.py), [`chess_client.py`](chess_client.py) |
| **3** | **Lamport Clock Synchronization** | Logical clocks, Happened-before relation ($a \to b$), $L = \max(L, L_{msg}) + 1$ | [`lamport_clock.py`](lamport_clock.py), [`proto/lamport_chess.proto`](proto/lamport_chess.proto), [`lamport_chess_server.py`](lamport_chess_server.py), [`lamport_chess_client.py`](lamport_chess_client.py) |
| **4** | **Ricart-Agrawala Mutual Exclusion** | P2P Mutex, deferred replies via blocking gRPC handlers, tie-breaking `(timestamp, node_id)` | [`node.py`](node.py), [`run_exp4.py`](run_exp4.py), [`proto/artwork.proto`](proto/artwork.proto) |
| **5** | **Deadlock Simulation & Resolution** | Wait-For Graph (WFG) cycle detection, reverse lock acquisition order, abort & retry | [`lock_manager.py`](lock_manager.py), [`worker.py`](worker.py), [`run_exp5.py`](run_exp5.py) |
| **6** | **Load Balancing (Least Connections)** | Dynamic routing to backend with minimum in-flight connections, thread-safe counter tracking | [`proto/service.proto`](proto/service.proto), [`worker_server.py`](worker_server.py), [`load_balancer.py`](load_balancer.py), [`run_exp6.py`](run_exp6.py) |
| **7** | **Eventual Consistency (Gossip + LWW)** | Accept-then-gossip asynchronous replication, deterministic Last-Write-Wins via `(lamport_timestamp, origin_replica)` | [`proto/replica.proto`](proto/replica.proto), [`replica_node.py`](replica_node.py), [`replica_client.py`](replica_client.py), [`run_exp7.py`](run_exp7.py) |
| **8** | **Redis Caching & Fault Tolerance** | Cache-Aside pattern, dual-key fresh short-TTL + stale fallback, graceful degradation | [`cache_gateway.py`](cache_gateway.py), [`server.py`](server.py), [`redis_server.py`](redis_server.py), [`run_exp8.py`](run_exp8.py) |
| **9** | **Raft Leader Election & Failover** | Consensus-driven fault tolerance, randomized election timeouts (1.5–3.0s), terms, quorum voting ($N//2+1$), gated coordination | [`proto/raft.proto`](proto/raft.proto), [`raft_node.py`](raft_node.py), [`raft_client.py`](raft_client.py), [`run_exp9.py`](run_exp9.py) |
| **10** | **Deploy on Kubernetes & Simulate Load** | Containerized microservices, Headless Service (`clusterIP: None`), gRPC round-robin client-side load balancing, pod failover, load burst job | [`Dockerfile`](Dockerfile), [`net_config.py`](net_config.py), [`k8s/app.yaml`](k8s/app.yaml), [`k8s/load-test-job.yaml`](k8s/load-test-job.yaml), [`load_test.py`](load_test.py), [`run_exp10.py`](run_exp10.py) |
| **11** | **Distributed File System (DFS)** | Decoupled metadata tracking, 64 KB chunking, R=2 replication, Lamport clock versioning, heartbeat timeout failure detection, silent corruption detection via SHA-256, self-healing chunk repair | [`proto/dfs.proto`](proto/dfs.proto), [`dfs_metadata.py`](dfs_metadata.py), [`dfs_storage.py`](dfs_storage.py), [`dfs_client.py`](dfs_client.py), [`dfs_repair.py`](dfs_repair.py), [`run_exp11.py`](run_exp11.py) |

---

## 🚀 How to Run the Experiments

### Experiment 2: gRPC RPC Communication
* **Terminal 1 (Server)**: `python chess_server.py`
* **Terminal 2 (Client)**: `python chess_client.py`

### Experiment 3: Lamport Logical Clock Synchronization
* **Terminal 1 (Server)**: `python lamport_chess_server.py`
* **Terminal 2 (Client)**: `python lamport_chess_client.py`

### Experiment 4: Ricart-Agrawala Mutual Exclusion
* **Automated Runner**: `python run_exp4.py`
* **Manual 3 Terminals**: `python node.py 1`, `python node.py 2`, `python node.py 3`

### Experiment 5: Deadlock Simulation & Resolution
* **Automated Runner (Both Runs)**: `python run_exp5.py`
* **Run 1 (Simulate Deadlock Hang)**:
  * Terminal 1: `python lock_manager.py`
  * Terminal 2: `python worker.py 1 autosave`
  * Terminal 3: `python worker.py 2 submission`
* **Run 2 (Detect & Resolve Deadlock)**:
  * Terminal 1: `python lock_manager.py detect`
  * Terminal 2: `python worker.py 1 autosave`
  * Terminal 3: `python worker.py 2 submission`

### Experiment 6: Load Balancing (Least Connections)
* **Automated Runner (All-in-One)**: `python run_exp6.py`
* **Manual 4 Terminals**:
  * Terminal 1: `python worker_server.py 60201`
  * Terminal 2: `python worker_server.py 60202`
  * Terminal 3: `python worker_server.py 60203`
  * Terminal 4: `python load_balancer.py`

### Experiment 7: Eventual Consistency (Gossip + Last-Write-Wins)
* **Automated Runner (All-in-One)**: `python run_exp7.py`
* **Manual 4 Terminals**:
  * Terminal 1: `python replica_node.py A 60301`
  * Terminal 2: `python replica_node.py B 60302`
  * Terminal 3: `python replica_node.py C 60303`
  * Terminal 4: `python replica_client.py`

### Experiment 8: Redis Caching for Fault Tolerance (Cache-Aside)
* **Automated Runner (All 4 Stages)**: `python run_exp8.py`
* **Manual 3 Terminals**:
  * Terminal 1 (Redis): `redis-server` (or `python redis_server.py 6379`)
  * Terminal 2 (Backend): `python server.py` (or `python chess_server.py`)
  * Terminal 3 (Gateway): `python cache_gateway.py 1`

### Experiment 9: Raft Leader Election & Failover (Consensus)
* **Automated Runner (All 4 Stages)**: `python run_exp9.py`
* **Manual 4 Terminals**:
  * Terminal 1: `python raft_node.py A`
  * Terminal 2: `python raft_node.py B`
  * Terminal 3: `python raft_node.py C`
  * Terminal 4 (Client Queries): `python raft_client.py A championship_slot 1`

### Experiment 10: Kubernetes Deployment & Concurrent Load Simulation
* **Automated Validator / Emulation Runner**: `python run_exp10.py`
* **Live Cluster Execution (Docker Desktop / Minikube)**:
  1. Build Image: `docker build -t myapp-backend:latest .`
  2. Deploy Services: `kubectl apply -f k8s/app.yaml`
  3. Verify Pods: `kubectl get pods`
  4. Run Load Test Job: `kubectl apply -f k8s/load-test-job.yaml`
  5. Inspect Logs: `kubectl wait --for=condition=complete job/load-test --timeout=90s && kubectl logs job/load-test`
  6. Verify Multi-Pod Distribution:
     ```bash
     for p in $(kubectl get pods -l app=worker -o name); do echo $p; kubectl logs $p | grep -o "Handling request" | wc -l; done
     ```
  7. Cleanup: `kubectl delete job load-test && kubectl delete -f k8s/app.yaml`

### Experiment 11: Distributed File System (Chunking, Replication, Failover & Repair)
* **Automated Runner (All 6 Failure & Repair Tests)**: `python run_exp11.py`
* **Manual 5 Terminals**:
  * Terminal 1 (Metadata Server): `python dfs_metadata.py`
  * Terminal 2 (Storage Node 1): `python dfs_storage.py 1`
  * Terminal 3 (Storage Node 2): `python dfs_storage.py 2`
  * Terminal 4 (Storage Node 3): `python dfs_storage.py 3`
  * Terminal 5 (Client CLI & Repair):
    ```bash
    python dfs_client.py status
    python dfs_client.py put photo.bin
    python dfs_client.py get photo.bin out1.bin
    python dfs_repair.py
    ```

---

## 🎯 Viva Q&A Quick Summary

1. **Exp 2 (gRPC)**: Remote Procedure Calls using Protocol Buffers over HTTP/2 for low latency, binary serialized communication.
2. **Exp 3 (Lamport Clocks)**: Scalar counters advancing on send ($L+1$) and receive ($\max(L_{local}, L_{msg}) + 1$) to establish causal order without synchronized physical clocks.
3. **Exp 4 (Ricart-Agrawala)**: Decentralized peer-to-peer mutual exclusion with $2(N-1)$ messages using blocking gRPC handlers to defer replies until exiting the critical section.
4. **Exp 5 (Deadlocks)**: Resolving circular wait on shared resources (`draft` vs `submission`) using a centralized Wait-For Graph (WFG) that detects directed cycles and aborts the newer request to allow the system to self-heal.
5. **Exp 6 (Load Balancing - Least Connections)**: Routes incoming requests to whichever backend currently has the minimum active (in-flight) connections; unlike static Round Robin, it dynamically balances load across backends with variable processing times.
6. **Exp 7 (Eventual Consistency - Gossip & LWW)**: Replicas accept local writes immediately (maximizing availability) and gossip asynchronously. Conflicts are resolved via Last-Write-Wins using `(lamport_timestamp, origin_replica)` tuples, guaranteeing eventual convergence after a brief disagreement window.
7. **Exp 8 (Redis Caching & Fault Tolerance - Cache-Aside)**: Dual-key caching architecture where fast reads hit fresh keys (`fresh:item:` with TTL), and the system degrades gracefully under failure: if Redis fails, queries bypass directly to the backend; if the backend fails, queries fall back to never-expiring stale backup keys (`stale:item:`).
8. **Exp 9 (Raft Leader Election & Failover)**: Consensus protocol establishing a single coordinator among replicas using randomized election timeouts (1.5–3.0s) to prevent split votes, monotonically increasing term counters to reject stale leaders, majority quorum ($N//2 + 1$) voting, and gated coordination where only the current active leader grants locks while followers redirect clients.
9. **Exp 10 (Kubernetes Deployment & Load Balancing)**: Packaging microservices into containers, solving the "gRPC single-connection trap" using Headless Services (`clusterIP: None`) and client-side round-robin balancing, demonstrating Kubernetes pod self-healing, and simulating concurrent burst traffic via in-cluster Kubernetes Jobs.
10. **Exp 11 (Distributed File System - GFS/HDFS style)**: Decoupling metadata from raw chunk storage, splitting large files into 64 KB chunks with $R=2$ replication, using Lamport clocks for file versions, heartbeat failure detection (6s), automated repair re-replication, and checksum verification with failover on disk corruption.


