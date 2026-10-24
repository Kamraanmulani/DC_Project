# ♟️ Distributed Computing (DC) Lab Experiments (2, 3, 4 & 5): ChessMate

**Subject**: Distributed Computing (Sem 7)  
**Faculty**: Prof. Dhanashree Tamhane  
**Project**: **ChessMate** (Distributed Multiplayer Chess Platform)  
**Technology Stack**: Python 3.10, gRPC, Protocol Buffers (proto3), Lamport Logical Clocks, Ricart-Agrawala Mutual Exclusion, Wait-For Graph Deadlock Detection, python-chess  

---

## 📌 Summary of Implemented Experiments

| Exp # | Experiment Title | Key Mechanism | Files |
|:---:|:---|:---|:---|
| **2** | **RPC APIs Between Services** | gRPC over HTTP/2, Protobuf binary serialization | [`proto/chess.proto`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/proto/chess.proto), [`chess_server.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/chess_server.py), [`chess_client.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/chess_client.py) |
| **3** | **Lamport Clock Synchronization** | Logical clocks, Happened-before relation ($a \to b$), $L = \max(L, L_{msg}) + 1$ | [`lamport_clock.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/lamport_clock.py), [`proto/lamport_chess.proto`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/proto/lamport_chess.proto), [`lamport_chess_server.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/lamport_chess_server.py), [`lamport_chess_client.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/lamport_chess_client.py) |
| **4** | **Ricart-Agrawala Mutual Exclusion** | P2P Mutex, deferred replies via blocking gRPC handlers, tie-breaking `(timestamp, node_id)` | [`node.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/node.py), [`run_exp4.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/run_exp4.py), [`proto/artwork.proto`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/proto/artwork.proto) |
| **5** | **Deadlock Simulation & Resolution** | Wait-For Graph (WFG) cycle detection, reverse lock acquisition order, abort & retry | [`lock_manager.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/lock_manager.py), [`worker.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/worker.py), [`run_exp5.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/run_exp5.py) |

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

---

## 🎯 Viva Q&A Quick Summary

1. **Exp 2 (gRPC)**: Remote Procedure Calls using Protocol Buffers over HTTP/2 for low latency, binary serialized communication.
2. **Exp 3 (Lamport Clocks)**: Scalar counters advancing on send ($L+1$) and receive ($\max(L_{local}, L_{msg}) + 1$) to establish causal order without synchronized physical clocks.
3. **Exp 4 (Ricart-Agrawala)**: Decentralized peer-to-peer mutual exclusion with $2(N-1)$ messages using blocking gRPC handlers to defer replies until exiting the critical section.
4. **Exp 5 (Deadlocks)**: Resolving circular wait on shared resources (`draft` vs `submission`) using a centralized Wait-For Graph (WFG) that detects directed cycles and aborts the newer request to allow the system to self-heal.
