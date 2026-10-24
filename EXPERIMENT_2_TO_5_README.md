# 🏆 Distributed Computing (DC) Lab: Experiments 2 to 5 Comprehensive Guide

**Course**: Distributed Computing (Sem 7 - Computer Engineering)  
**Faculty In-Charge**: Prof. Dhanashree Tamhane  
**Mini-Project**: **ChessMate** (Distributed Multiplayer Chess Platform)  
**Technology Stack**: Python 3.10, gRPC, Protocol Buffers (proto3), Lamport Logical Clocks, Ricart-Agrawala Mutual Exclusion, Wait-For Graph Deadlock Detection, python-chess  

---

## 📑 Table of Contents
1. [Overview & Project Architecture](#-overview--project-architecture)
2. [Experiment 2: Develop RPC APIs Between Services (gRPC over HTTP/2)](#-experiment-2-develop-rpc-apis-between-services)
3. [Experiment 3: Lamport Logical Clock Synchronization](#-experiment-3-lamport-logical-clock-synchronization)
4. [Experiment 4: Ricart-Agrawala Mutual Exclusion over gRPC](#-experiment-4-ricart-agrawala-mutual-exclusion-over-grpc)
5. [Experiment 5: Simulate & Resolve Deadlocks via Wait-For Graph Cycle Detection](#-experiment-5-simulate--resolve-deadlocks-via-wait-for-graph)
6. [Master Viva Cheat-Sheet (Top 25 Questions & Answers)](#-master-viva-cheat-sheet-top-25-questions--answers)
7. [Quick Command Reference Guide](#-quick-command-reference-guide)

---

## 🏛️ Overview & Project Architecture

In modern distributed systems, standalone monolithic architectures are replaced by decoupled microservices that communicate over the network. Throughout Experiments 2 to 5, we have implemented the complete distributed computing hierarchy for our **ChessMate** platform:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CHESSMATE SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Exp 2] Inter-Service RPC        : Client Node  <──gRPC/HTTP2──> Server Node│
│  [Exp 3] Event Synchronization   : Lamport Clock attached to every RPC msg  │
│  [Exp 4] Distributed Mutex        : P2P Ricart-Agrawala (No Central Server) │
│  [Exp 5] Concurrency & Deadlocks : Central WFG Cycle Detection & Resolution │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ♟️ Experiment 2: Develop RPC APIs Between Services

### 1. Main Aim
> **To develop and implement Remote Procedure Call (RPC) APIs using gRPC for high-speed, strongly typed communication between distributed client and server microservices in the ChessMate project.**

### 2. Why Are We Doing This? (Motivation & Need)
* **Shortcomings of REST/JSON**: Traditional HTTP/1.1 REST APIs exchange plain-text JSON. In real-time multiplayer gaming like ChessMate, JSON parsing is computationally slow, payloads are bloated with string keys, and HTTP/1.1 suffers from Head-of-Line (HoL) blocking.
* **The RPC Paradigm**: Remote Procedure Call (RPC) allows a client program to execute a function on a remote machine with the exact same syntax as a local in-memory function call (`result = stub.MakeMove(...)`).
* **Why gRPC**: Developed by Google, gRPC operates on top of **HTTP/2** (multiplexing multiple parallel calls over a single TCP connection, header compression) and serializes structured data using binary **Protocol Buffers** (`proto3`), yielding 5x to 10x higher throughput and strict compile-time type safety.

### 3. What Is It Useful For in ChessMate?
* **Decoupling**: The **Chess Client Service** (player UI / frontend gateway) is physically separated from the compute-intensive **Chess Game Server** (board evaluator, move legality validator, room state manager).
* **Guaranteed Rule Enforcement**: Moves are validated server-side using the international rules of chess (`chess.Board`), preventing client tampering.

### 4. How We Have Done It (Technical Architecture)
1. **Defined the Interface Definition Language (IDL)** in [`proto/chess.proto`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/proto/chess.proto):
   * `rpc CreateRoom (CreateRoomRequest) returns (CreateRoomResponse)`
   * `rpc MakeMove (MakeMoveRequest) returns (MakeMoveResponse)`
   * `rpc GetGameState (GetGameStateRequest) returns (GetGameStateResponse)`
2. **Compiled Protobuf Stubs**:
   ```bash
   python -m grpc_tools.protoc -I=proto --python_out=. --grpc_python_out=. proto/chess.proto
   ```
   Generates `chess_pb2.py` (message classes) and `chess_pb2_grpc.py` (client stubs & server servicer base classes).
3. **Implemented Server** ([`chess_server.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/chess_server.py)):
   * Inherits from `chess_pb2_grpc.ChessServiceServicer`.
   * Manages in-memory chess rooms, handles moves, tracks turns (White vs Black), detects check/checkmate using `python-chess`.
   * Listens on TCP port `50051`.
4. **Implemented Client** ([`chess_client.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/chess_client.py)):
   * Connects via `grpc.insecure_channel('localhost:50051')`.
   * Creates a room $\to$ plays White $e2 \to e4$ $\to$ plays Black $e7 \to e5$ $\to$ plays White $g1 \to f3$ $\to$ queries full game state.

### 5. How to Manually Run Experiment 2
* **Terminal 1 (Server)**:
  ```bash
  python chess_server.py
  ```
* **Terminal 2 (Client)**:
  ```bash
  python chess_client.py
  ```

### 6. Expected Output
* **Server**:
  ```text
  [SERVER] Initialized ChessMate Game State Manager
  Chess Service Started on Port 50051...
  [SERVER] [RPC: CreateRoom] Room Created: 'VIT-DC Championship Room' (Code: 402)
  [SERVER] [RPC: MakeMove] Room 402: WHITE played e4 -> Next turn: black
  [SERVER] [RPC: MakeMove] Room 402: BLACK played e5 -> Next turn: white
  [SERVER] [RPC: MakeMove] Room 402: WHITE played Nf3 -> Next turn: black
  [SERVER] [RPC: GetGameState] Room 402 state queried. Total moves: 3
  ```
* **Client**:
  ```text
  [STEP 1] Invoking RPC: CreateRoom()... -> Room Code: 402, Status: created
  [STEP 2] Invoking RPC: MakeMove() -> White e2 to e4 -> Valid: True, SAN: e4, Turn: black
  [STEP 3] Invoking RPC: MakeMove() -> Black e7 to e5 -> Valid: True, SAN: e5, Turn: white
  [STEP 4] Invoking RPC: MakeMove() -> White g1 to f3 -> Valid: True, SAN: Nf3, Turn: black
  [STEP 5] Invoking RPC: GetGameState() -> History: ['e4', 'e5', 'Nf3'], Board FEN retrieved
  ```

### 7. Key Viva Questions for Experiment 2
* **Q: What is RPC?**
  * *A*: A communication mechanism allowing a computer program to cause a subroutine to execute on another machine in a network without the programmer explicitly coding network details.
* **Q: Why is Protocol Buffers faster than JSON?**
  * *A*: Protobuf is a compact binary serialization format. Field names are mapped to numeric tags (1, 2, 3), stripping out verbose text keys. Numbers are stored using varints, and no textual whitespace or quotes are parsed.
* **Q: What features does HTTP/2 provide to gRPC?**
  * *A*: Binary framing, multiplexing (multiple bidirectional requests over one TCP socket), HPACK header compression, and native client/server streaming.
* **Q: What is the difference between a Stub and a Servicer?**
  * *A*: A **Stub** is the client-side proxy that marshals parameters and dispatches the call over the network. A **Servicer** is the server-side abstract interface that the programmer subclasses to provide real business logic.

---

## ⏰ Experiment 3: Lamport Logical Clock Synchronization

### 1. Main Aim
> **To implement Leslie Lamport's Logical Clock Synchronization algorithm to maintain consistent causal event ordering across distributed services without physical clock synchronization.**

### 2. Why Are We Doing This? (Motivation & Need)
* **The Physical Clock Problem**: In distributed computing, every physical machine has its own quartz crystal oscillator clock. Due to manufacturing variations and temperature, physical clocks experience **clock drift** (gradually gaining or losing time) and **clock skew** (difference in time between two clocks). Even NTP (Network Time Protocol) cannot eliminate millisecond uncertainty.
* **The Causality Problem**: If Player 1 creates a game room at physical time $t_1$, and Player 2 joins at physical time $t_2$, clock skew could cause $t_2 < t_1$, creating an impossible causality paradox where a move is played in a room that hasn't been created yet!
* **The Solution**: In 1978, Leslie Lamport proved that physical time doesn't matter for correctness; what matters is **causal order** ("Happened-Before" relationship $a \to b$).

### 3. What Is It Useful For in ChessMate?
* **Deterministic Event Ordering**: Guarantees that chess game room initialization strictly precedes Move 1, and Move 1 strictly precedes Move 2, regardless of clock drift on client or server hardware.
* **Auditability & Traceability**: Provides a reliable logical timeline for distributed game logs and anti-cheat replay verification.

### 4. How We Have Done It (Technical Architecture)
1. **Implemented Lamport Algorithm** in [`lamport_clock.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/lamport_clock.py):
   * State variable: `self.time = 0`
   * **Rule 1 (Local / Send Event)**: Advance local clock by 1:
     $$L = L + 1$$
   * **Rule 2 (Receive Event)**: Upon message arrival with timestamp $L_{received}$, update:
     $$L = \max(L_{local}, L_{received}) + 1$$
2. **Updated Proto Definition** in [`proto/lamport_chess.proto`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/proto/lamport_chess.proto):
   * Every request message embeds `int64 lamport_time`.
   * Every response message embeds `int64 lamport_time`.
3. **Synchronized Client & Server** ([`lamport_chess_client.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/lamport_chess_client.py) & [`lamport_chess_server.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/lamport_chess_server.py)):
   * **Client send `CreateRoom`**: Clock advances $0 \to$ **`1`**.
   * **Server receive & respond**: Clock updates $\max(0, 1) + 1 =$ **`2`**. Client receives $\to$ Clock is **`2`**.
   * **Client send `MakeMove (e2->e4)`**: Clock advances $2 \to$ **`3`**.
   * **Server receive & respond**: Clock updates $\max(2, 3) + 1 =$ **`4`**. Client receives $\to$ Clock is **`4`**.
   * **Client send `MakeMove (e7->e5)`**: Clock advances $4 \to$ **`5`**.
   * **Server receive & respond**: Clock updates $\max(4, 5) + 1 =$ **`6`**. Client receives $\to$ Clock is **`6`**.
   * **Client send `GetGameState`**: Clock advances $6 \to$ **`7`**.
   * **Server receive & respond**: Clock updates $\max(6, 7) + 1 =$ **`8`**. Client receives $\to$ Clock is **`8`**.

### 5. How to Manually Run Experiment 3
* **Terminal 1 (Server)**:
  ```bash
  python lamport_chess_server.py
  ```
* **Terminal 2 (Client)**:
  ```bash
  python lamport_chess_client.py
  ```

### 6. Expected Output
```text
========== CREATE ROOM ==========
Sending Request    | Lamport Clock : 1
Received Response  | Lamport Clock : 2 (Room Code: 839)

========== MAKE MOVE (WHITE: e2 to e4) ==========
Sending Request    | Lamport Clock : 3
Received Response  | Lamport Clock : 4 (Valid: True, Move: e4)

========== MAKE MOVE (BLACK: e7 to e5) ==========
Sending Request    | Lamport Clock : 5
Received Response  | Lamport Clock : 6 (Valid: True, Move: e5)

========== GET GAME STATE ==========
Sending Request    | Lamport Clock : 7
Received Response  | Lamport Clock : 8 (Moves: ['e4', 'e5'])
```

### 7. Key Viva Questions for Experiment 3
* **Q: What is the "Happened-Before" relationship ($a \to b$)?**
  * *A*: Defined by Lamport:
    1. If $a$ and $b$ occur in the same process and $a$ occurs before $b$, then $a \to b$.
    2. If $a$ is the sending of a message and $b$ is the receipt of that message, then $a \to b$.
    3. If $a \to b$ and $b \to c$, then $a \to c$ (transitivity).
* **Q: If $C(a) < C(b)$, did $a$ causally cause $b$? (TRICK QUESTION)**
  * *A*: **No!** If $a \to b$, then $C(a) < C(b)$ is guaranteed (Clock Condition). However, the converse is **not necessarily true**. If $C(a) < C(b)$, the two events could be independent / concurrent ($a \parallel b$). Lamport clocks define a **partial order**, not a causal history (which requires Vector Clocks).
* **Q: What is the difference between Lamport Clocks and Vector Clocks?**
  * *A*: Lamport clocks use a single scalar integer (cannot distinguish causal vs concurrent events). Vector clocks maintain an array of size $N$ (one integer per process), allowing an exact determination of whether $a \to b$ or $a \parallel b$.

---

## 🛡️ Experiment 4: Ricart-Agrawala Mutual Exclusion over gRPC

### 1. Main Aim
> **To implement peer-to-peer distributed mutual exclusion using the Ricart-Agrawala algorithm over gRPC, ensuring exclusive access to a shared resource without any central coordinator.**

### 2. Why Are We Doing This? (Motivation & Need)
* **Single Point of Failure (SPOF)**: A centralized coordinator managing locks will crash if the coordinator node goes down, halting the entire distributed system.
* **Why Ricart-Agrawala**: It is a completely decentralized, permission-based mutual exclusion algorithm. Every node acts as both a client and a server. It optimizes Lamport's original mutual exclusion algorithm, reducing message complexity from $3(N-1)$ to only **$2(N-1)$ messages** per critical section entry.

### 3. What Is It Useful For in ChessMate?
* **Tournament Slot Assignment / Leaderboard Broadcast**: Multiple decentralized tournament nodes compete to claim an exclusive **Tournament Championship Submission Slot**. Only one node can hold the slot at any instant.

### 4. How We Have Done It (Technical Architecture)
1. **Defined Proto Service** in [`proto/artwork.proto`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/proto/artwork.proto) and [`proto/chess.proto`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/proto/chess.proto):
   * `service MutexService { rpc RequestAccess (AccessRequest) returns (AccessReply); }`
   * `AccessRequest { int32 node_id; int32 timestamp; }`
2. **Three Node States** in [`node.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/node.py):
   * `RELEASED`: Outside critical section (grants all incoming requests).
   * `WANTED`: Wants critical section; broadcasts requests to all peers.
   * `HELD`: Executing inside critical section (defers all incoming requests).
3. **The Core Algorithm Decision Logic (`RequestAccess`)**:
   A node **DEFERS** an incoming peer request if and only if:
   $$\text{State} == \text{"HELD"} \quad \text{OR} \quad (\text{State} == \text{"WANTED"} \ \land \ (T_{local}, ID_{local}) < (T_{req}, ID_{req}))$$
   Otherwise, it **GRANTS** immediately.
4. **The gRPC Blocking Handler Trick**:
   * Instead of sending an explicit separate reply message later, the server's RPC thread simply **blocks** on a `threading.Event().wait()`.
   * When the holding node exits the critical section (`release_cs()`), it invokes `event.set()`, which unblocks the handler and returns the response. The RPC response *is* the reply!
5. **Tie-Breaking Rule**:
   * If two nodes request access with identical timestamps ($T_1 == T_2$), tie-breaking is done using node ID: $(T_1, \text{ID}_1) < (T_2, \text{ID}_2)$. Smaller node ID wins priority.

### 5. How to Manually Run Experiment 4
#### Option A: Automated Multi-Process Runner (Recommended)
```bash
python run_exp4.py
```
#### Option B: Manual 3-Terminal Execution (Lab PDF Method)
Open 3 separate terminals in the project root and launch within 6 seconds of each other:
* **Terminal 1**: `python node.py 1` (port 60051)
* **Terminal 2**: `python node.py 2` (port 60052)
* **Terminal 3**: `python node.py 3` (port 60053)

### 6. Expected Output
```text
[Node-1] WANTS critical section (Timestamp: 1) -> Node-2 GRANTS, Node-3 GRANTS
[Node-1] >>> ENTERED CRITICAL SECTION <<<
[Node-2] WANTS critical section (Timestamp: 4) -> Node-1 DEFERS (Node-1 priority < Node-2)
[Node-3] WANTS critical section (Timestamp: 4) -> Node-1 DEFERS (Node-1 priority < Node-3)
[Node-1] RELEASED critical section. Unblocking 2 deferred peers...

--- Tie-Breaking Between Node-2 (4, 2) and Node-3 (4, 3) ---
[Node-2] DEFERS request from Node-3 [(4, 2) < (4, 3)]
[Node-2] >>> ENTERED CRITICAL SECTION <<<
[Node-2] RELEASED critical section. Unblocking Node-3...
[Node-3] >>> ENTERED CRITICAL SECTION <<<
[Node-3] RELEASED critical section.
```

### 7. Key Viva Questions for Experiment 4
* **Q: How many messages does Ricart-Agrawala require?**
  * *A*: $2(N - 1)$ messages per critical section execution ($N-1$ request messages sent, $N-1$ replies received).
* **Q: Why does Ricart-Agrawala need fewer messages than Lamport's algorithm?**
  * *A*: Lamport's algorithm requires $3(N-1)$ messages because it sends an explicit release message to all peers. Ricart-Agrawala suppresses the reply when a node wants the critical section and only sends the reply when it releases it, combining the reply and release steps.
* **Q: How do you prevent deadlocks in Ricart-Agrawala?**
  * *A*: Requests are totally ordered by $(timestamp, node\_id)$. Since timestamps strictly increase and node IDs are unique, no cycle of dependencies can ever form.

---

## 🔄 Experiment 5: Simulate & Resolve Deadlocks via Wait-For Graph

### 1. Main Aim
> **To simulate a circular wait deadlock caused by inverted shared lock acquisition, and implement an automated centralized Wait-For Graph (WFG) cycle detection algorithm to detect and resolve the deadlock.**

### 2. Why Are We Doing This? (Motivation & Need)
* **The Deadlock Dilemma**: When multiple concurrent processes acquire multiple resources in an inconsistent order, deadlocks can occur.
* **The 4 Coffman Conditions**:
  1. *Mutual Exclusion* (exclusive lock ownership).
  2. *Hold and Wait* (holding one lock while waiting for another).
  3. *No Preemption* (locks cannot be forcibly stripped).
  4. *Circular Wait* (Process A waits for B, Process B waits for A).
* **Why Detection & Recovery**: In complex distributed architectures, strictly enforcing lock ordering at compile-time is often impossible. Therefore, systems must dynamically detect cycles in their Wait-For Graph and resolve them by aborting and retrying.

### 3. What Is It Useful For in ChessMate?
* Resolving contention between two concurrent background services in ChessMate:
  * **AutoSave Service**: Locks `draft` (current board state) $\to$ then locks `submission` (leaderboard update).
  * **Final Submission Service**: Locks `submission` (match result) $\to$ then locks `draft` (current board state).
* Without cycle detection, both services freeze permanently.

### 4. How We Have Done It (Technical Architecture)
1. **Defined Proto Service** in [`proto/artwork.proto`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/proto/artwork.proto) and [`proto/chess.proto`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/proto/chess.proto):
   * `service LockService { rpc AcquireLock; rpc ReleaseLock; }`
2. **Central LockManager** ([`lock_manager.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/lock_manager.py)):
   * Tracks `self.locks = {resource_id: owner_id}` and `self.wait_for = {holder_id: resource_id}`.
   * Runs DFS cycle detection (`_would_cycle`):
     ```python
     def _would_cycle(self, holder, resource):
         visited = set()
         current_resource = resource
         while True:
             owner = self.locks.get(current_resource)
             if owner is None or owner == holder:
                 return owner == holder
             if owner in visited: return False
             visited.add(owner)
             current_resource = self.wait_for.get(owner)
             if current_resource is None: return False
     ```
3. **Deadlock Resolution Policy**:
   * If `DETECT == True` and `_would_cycle()` returns True, LockManager returns:
     `LockReply(granted=False, message="deadlock-abort")`.
4. **Worker Recovery Strategy** ([`worker.py`](file:///c:/Users/Kamraam/Desktop/Sem%207/DC/ChessMate/worker.py)):
   * Catches `deadlock-abort`.
   * Immediately releases its held lock (breaking the *Hold and Wait* condition).
   * Backs off for 1.0 second (breaking the *Circular Wait*).
   * Retries acquiring both locks once the competing worker has completed.

### 5. How to Manually Run Experiment 5
#### Mode 1: Automated All-in-One Runner
```bash
python run_exp5.py          # Runs both Run 1 and Run 2 sequentially
python run_exp5.py sim      # Run 1 only (Simulation)
python run_exp5.py detect   # Run 2 only (Detection & Resolution)
```

#### Mode 2: Manual 3-Terminal Execution (Lab PDF Method)
##### Run 1 — Deadlock Simulation (Proving the Hang)
* **Terminal 1**: `python lock_manager.py` (Deadlock detection = False)
* **Terminal 2**: `python worker.py 1 autosave`
* **Terminal 3**: `python worker.py 2 submission`
*(Hit enter on Terminal 2 and 3 within 1s. Both will hang waiting for each other. Press Ctrl+C).*

##### Run 2 — Detect and Resolve Deadlock
* **Terminal 1**: `python lock_manager.py detect` (Deadlock detection = True)
* **Terminal 2**: `python worker.py 1 autosave`
* **Terminal 3**: `python worker.py 2 submission`
*(Observe: LockManager aborts Node-2 $\to$ Node-2 releases lock & retries $\to$ Node-1 finishes $\to$ Node-2 finishes $\to$ Both print `DONE`!)*

### 6. Expected Output (Run 2: Detection)
```text
[LockManager] Node-1 ACQUIRED 'draft'
[LockManager] Node-2 ACQUIRED 'submission'
[LockManager] Node-1 WAITING for 'submission' (held by Node-2)
[LockManager] DEADLOCK DETECTED: Node-2 -> 'draft' (held by Node-1) would close a cycle. Aborting Node-2.
[Worker-2] Node-2: 'draft' -> granted=False (deadlock-abort)
[Worker-2] Node-2: ABORTED -- releasing held locks and retrying
[LockManager] Node-2 RELEASED 'submission'
[LockManager] Node-1 ACQUIRED 'submission' (after wait)
[Worker-1] Node-1: DONE
[LockManager] Node-2 ACQUIRED 'draft' & 'submission'
[Worker-2] Node-2: DONE
```

### 7. Key Viva Questions for Experiment 5
* **Q: What is a Wait-For Graph (WFG)?**
  * *A*: A directed graph used for deadlock detection where vertices represent processes, and a directed edge $P_i \to P_j$ indicates that process $P_i$ is waiting for a resource currently held by process $P_j$. A directed cycle in a single-unit resource WFG indicates a deadlock.
* **Q: What is a "Phantom Deadlock"?**
  * *A*: A false deadlock detected in a distributed system due to message transmission delays. A detector may receive an outdated message stating a process is waiting, even though the process has already released the resource.
* **Q: Why use a Centralized Lock Manager for Deadlock Detection rather than decentralized?**
  * *A*: Cycle detection requires an instantaneous, global snapshot of who is holding what. Centralized detection avoids message coordination overhead and eliminates phantom deadlocks.
* **Q: How does our implementation prevent starvation after a deadlock abort?**
  * *A*: The aborted worker releases its held lock and executes a randomized backoff sleep (`time.sleep(1)`). This allows the other worker sufficient time to complete and release its resources before the aborted worker retries.

---

## 🎯 Master Viva Cheat-Sheet: Top 25 Questions & Answers

| # | Question | Concise Answer for Viva |
|:---:|:---|:---|
| **1** | What is Distributed Computing? | A system where multiple autonomous computing entities communicate over a network by passing messages to achieve a common goal. |
| **2** | What is an RPC? | Remote Procedure Call: an abstraction allowing a program to execute code on a remote server with local function syntax. |
| **3** | Why gRPC over REST? | gRPC uses binary Protocol Buffers (faster & smaller than JSON) and HTTP/2 (multiplexing, bidirectional streaming). |
| **4** | What is an IDL? | Interface Definition Language (`.proto` file) that defines services and data types independently of programming languages. |
| **5** | What is Protocol Buffers? | Google's open-source binary serialization format that encodes structured data using numeric field tags instead of string names. |
| **6** | What is HTTP/2 Multiplexing? | Interleaving multiple independent request/response streams over a single TCP connection, eliminating head-of-line blocking. |
| **7** | What are the 4 gRPC streaming types? | Unary (1:1), Server Streaming (1:N), Client Streaming (N:1), Bidirectional Streaming (N:M). |
| **8** | Why cannot physical clocks be trusted in DC? | Quartz oscillators drift over time due to heat and manufacturing differences; network latency prevents exact synchronization. |
| **9** | What is clock drift vs clock skew? | **Drift** is the rate difference at which clocks tick (frequency error). **Skew** is the instantaneous difference in time between two clocks. |
| **10** | What is the Happened-Before relation ($\to$)? | Formulated by Leslie Lamport to define causal precedence: same-process order, send-before-receive, and transitivity. |
| **11** | What are Lamport Logical Clock rules? | Send/Local: $L = L + 1$. Receive: $L = \max(L_{local}, L_{received}) + 1$. |
| **12** | If $C(a) < C(b)$, did $a$ cause $b$? | **No!** Lamport clocks define a partial order. If $a \to b \implies C(a) < C(b)$, but $C(a) < C(b)$ does NOT imply $a \to b$ (could be concurrent). |
| **13** | What are Vector Clocks? | An extension where each process maintains a vector of size $N$, allowing exact determination of whether events are causal or concurrent. |
| **14** | What is Distributed Mutual Exclusion? | Ensuring that at most one node in a distributed system can access a critical section/shared resource at any given time. |
| **15** | Name 3 categories of Distributed Mutex. | 1. Centralized (coordinator), 2. Distributed / Permission-based (Lamport, Ricart-Agrawala), 3. Token-based (Suzuki-Kasami, Token Ring). |
| **16** | What is the message complexity of Ricart-Agrawala? | $2(N - 1)$ messages per critical section entry ($N-1$ requests + $N-1$ replies). |
| **17** | How does Ricart-Agrawala defer replies in gRPC? | The gRPC server handler blocks on a `threading.Event().wait()`. When the node exits CS, it calls `event.set()`, releasing the RPC response. |
| **18** | How are ties broken in Ricart-Agrawala? | Lexicographically by tuple: $(timestamp, node\_id)$. The smaller unique node ID wins priority. |
| **19** | Can Ricart-Agrawala deadlock? | **No**, because timestamps impose a strict global total ordering; cycles of waiting are mathematically impossible. |
| **20** | What are the 4 Coffman conditions for deadlock? | 1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait. |
| **21** | What is a Wait-For Graph (WFG)? | A directed graph where nodes are processes and edges represent process $P_i$ waiting for a resource held by $P_j$. A cycle indicates deadlock. |
| **22** | How do we detect cycles in a WFG? | By traversing the chain of dependencies from the resource owner using Depth-First Search (DFS). If it leads back to the requester, a cycle exists. |
| **23** | How did we resolve the deadlock in Experiment 5? | The Lock Manager aborted the newer requester (`deadlock-abort`), which yielded its held lock and backed off for 1 second before retrying. |
| **24** | What is a Phantom Deadlock? | A false deadlock detected due to network message delay where a released resource has not yet been registered by the central detector. |
| **25** | What role does backoff play after an abort? | Prevents "livelock" where both processes repeatedly abort and retry at the exact same instant. |

---

## ⚡ Quick Command Reference Guide

```bash
# -------------------------------------------------------------
# 1. SETUP ENVIRONMENT
# -------------------------------------------------------------
pip install -r requirements.txt

# -------------------------------------------------------------
# 2. RECOMPILE PROTOBUF STUBS (IF PROTO IS EDITED)
# -------------------------------------------------------------
python -m grpc_tools.protoc -I=proto --python_out=. --grpc_python_out=. proto/chess.proto
python -m grpc_tools.protoc -I=proto --python_out=. --grpc_python_out=. proto/lamport_chess.proto
python -m grpc_tools.protoc -I=proto --python_out=. --grpc_python_out=. proto/artwork.proto

# -------------------------------------------------------------
# 3. EXPERIMENT 2: gRPC RPC COMMUNICATION
# -------------------------------------------------------------
python chess_server.py        # Terminal 1: Server (Port 50051)
python chess_client.py        # Terminal 2: Client

# -------------------------------------------------------------
# 4. EXPERIMENT 3: LAMPORT LOGICAL CLOCKS
# -------------------------------------------------------------
python lamport_chess_server.py # Terminal 1: Server (Port 50051)
python lamport_chess_client.py # Terminal 2: Client

# -------------------------------------------------------------
# 5. EXPERIMENT 4: RICART-AGRAWALA MUTEX
# -------------------------------------------------------------
python run_exp4.py             # Automated 3-Node Orchestrator
# OR Manual:
python node.py 1              # Terminal 1 (Port 60051)
python node.py 2              # Terminal 2 (Port 60052)
python node.py 3              # Terminal 3 (Port 60053)

# -------------------------------------------------------------
# 6. EXPERIMENT 5: DEADLOCK SIMULATION & RESOLUTION
# -------------------------------------------------------------
python run_exp5.py             # Automated (Runs Simulation then Detection)
# OR Manual Run 1 (Simulation Hang):
python lock_manager.py        # Terminal 1
python worker.py 1 autosave   # Terminal 2
python worker.py 2 submission # Terminal 3
# OR Manual Run 2 (Detect & Resolve):
python lock_manager.py detect # Terminal 1
python worker.py 1 autosave   # Terminal 2
python worker.py 2 submission # Terminal 3
```
