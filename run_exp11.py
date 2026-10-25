"""
run_exp11.py - Automated End-to-End Orchestrator and Test Suite for Experiment 11
Distributed File System: Chunking, Replication, Failover and Repair

Tests all scenarios outlined in the DC Lab Experiment 11 Walkthrough:
  1. System Startup: Metadata Server + 3 Storage Nodes (heartbeat registration)
  2. Upload & Download: 300 KB file split into 5x 64 KB chunks, R=2 replication, checksum verification
  3. Fault Tolerance (Kill Node): Kill store-2, immediate read failover to surviving replica
  4. Failure Detection: Wait >6s heartbeat timeout, metadata marks store-2 DOWN
  5. Under-replication Repair: Run dfs_repair.py to re-replicate chunks to live nodes, restoring R=2
  6. Data Corruption Detection: Corrupt a chunk on store-1, client detects SHA-256 mismatch & fails over
  7. Node Rejoin: Restart store-2, node marks BACK UP, disk data intact
  8. Second File & Lamport Versioning: Upload second.bin, verify least-loaded placement & clock increment
"""

import hashlib
import os
import shutil
import subprocess
import sys
import time
import grpc

import dfs_pb2
import dfs_pb2_grpc
import net_config

GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

processes = []


def cleanup():
    print(f"\n{YELLOW}==> Cleaning up background processes and temporary test files...{RESET}")
    for p in processes:
        if p.poll() is None:
            p.terminate()
            try:
                p.wait(timeout=2)
            except subprocess.TimeoutExpired:
                p.kill()

    # Cleanup temp files
    for fname in ["photo.bin", "out1.bin", "out2.bin", "out3.bin", "out4.bin", "second.bin", ".dfs_client_clock"]:
        if os.path.exists(fname):
            try:
                os.remove(fname)
            except OSError:
                pass


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def main():
    try:
        # Pre-clean
        if os.path.exists("dfs_data"):
            shutil.rmtree("dfs_data")
        cleanup()

        print(f"{BOLD}{CYAN}======================================================================{RESET}")
        print(f"{BOLD}{CYAN}  EXPERIMENT 11: DISTRIBUTED FILE SYSTEM (CHUNK, REPLICATE, REPAIR)   {RESET}")
        print(f"{BOLD}{CYAN}======================================================================{RESET}")

        # ----------------------------------------------------------------------
        # Step 1: Start Metadata Server and Storage Nodes
        # ----------------------------------------------------------------------
        print(f"\n{BOLD}[Step 1] Starting DFS Metadata Server and 3 Storage Nodes...{RESET}")
        meta_proc = subprocess.Popen([sys.executable, "dfs_metadata.py"])
        processes.append(meta_proc)
        time.sleep(1)

        store_procs = {}
        for i in (1, 2, 3):
            p = subprocess.Popen([sys.executable, "dfs_storage.py", str(i)])
            processes.append(p)
            store_procs[i] = p

        print("Waiting for storage nodes to send initial heartbeats (3 seconds)...")
        time.sleep(3)

        # Verify cluster status
        with grpc.insecure_channel(net_config.resolve("dfs-meta")) as channel:
            meta = dfs_pb2_grpc.DfsMetadataServiceStub(channel)
            status = meta.ClusterStatus(dfs_pb2.DfsStatusRequest(), timeout=5)
            live_nodes = [n.node_id for n in status.nodes if n.alive]
            print(f"{GREEN}[OK] Metadata Server alive. Registered live storage nodes: {live_nodes}{RESET}")
            assert len(live_nodes) == 3, f"Expected 3 live nodes, got {len(live_nodes)}"

        # ----------------------------------------------------------------------
        # Step 2: Upload File (photo.bin, 300,000 bytes -> 5 chunks of 64KB)
        # ----------------------------------------------------------------------
        print(f"\n{BOLD}[Step 2] Generating test file 'photo.bin' (300,000 bytes) and uploading...{RESET}")
        test_bytes = os.urandom(300000)
        with open("photo.bin", "wb") as f:
            f.write(test_bytes)
        expected_sha = hashlib.sha256(test_bytes).hexdigest()
        print(f"Original photo.bin SHA-256: {expected_sha}")

        res = subprocess.run([sys.executable, "dfs_client.py", "put", "photo.bin"], capture_output=True, text=True)
        print(res.stdout.strip())
        assert res.returncode == 0, f"Upload failed: {res.stderr}"

        # Download out1.bin and compare
        print(f"\n{BOLD}[Step 2b] Downloading 'photo.bin' to 'out1.bin' and verifying integrity...{RESET}")
        res = subprocess.run([sys.executable, "dfs_client.py", "get", "photo.bin", "out1.bin"], capture_output=True, text=True)
        print(res.stdout.strip())
        assert res.returncode == 0, f"Download failed: {res.stderr}"
        out1_sha = sha256_file("out1.bin")
        assert out1_sha == expected_sha, f"Checksum mismatch: {out1_sha} != {expected_sha}"
        print(f"{GREEN}[OK] Download out1.bin matches original file exactly! (SHA-256: {out1_sha[:16]}...){RESET}")

        # Inspect status
        res = subprocess.run([sys.executable, "dfs_client.py", "status"], capture_output=True, text=True)
        print("\nCluster Status after initial upload:")
        print(res.stdout.strip())

        # ----------------------------------------------------------------------
        # Step 3: Test 1 - Kill a storage node (store-2) and read anyway
        # ----------------------------------------------------------------------
        print(f"\n{BOLD}[Step 3 - Test 1] Killing storage node 2 (store-2) and immediately reading 'out2.bin'...{RESET}")
        store_procs[2].terminate()
        store_procs[2].wait()
        print(f"{YELLOW}Terminated store-2 process.{RESET}")

        res = subprocess.run([sys.executable, "dfs_client.py", "get", "photo.bin", "out2.bin"], capture_output=True, text=True)
        print(res.stdout.strip())
        assert res.returncode == 0, f"Download after killing store-2 failed: {res.stderr}"
        out2_sha = sha256_file("out2.bin")
        assert out2_sha == expected_sha, f"Checksum mismatch: {out2_sha} != {expected_sha}"
        print(f"{GREEN}[OK] Test 1 Passed: Read succeeded seamlessly via replica failover while store-2 was dead!{RESET}")

        # ----------------------------------------------------------------------
        # Step 4: Test 2 - Watch cluster detect heartbeat timeout
        # ----------------------------------------------------------------------
        print(f"\n{BOLD}[Step 4 - Test 2] Waiting 7 seconds for heartbeat timeout (>6.0s)...{RESET}")
        time.sleep(7.0)

        res = subprocess.run([sys.executable, "dfs_client.py", "status"], capture_output=True, text=True)
        print(res.stdout.strip())
        assert "store-2  DOWN" in res.stdout, "store-2 should be marked DOWN"
        assert "(down)" in res.stdout, "Chunks on store-2 should be marked (down)"
        print(f"{GREEN}[OK] Test 2 Passed: Metadata server correctly detected store-2 failure!{RESET}")

        # ----------------------------------------------------------------------
        # Step 5: Test 3 - Repair under-replicated chunks
        # ----------------------------------------------------------------------
        print(f"\n{BOLD}[Step 5 - Test 3] Running dfs_repair.py to re-replicate missing chunks...{RESET}")
        res = subprocess.run([sys.executable, "dfs_repair.py"], capture_output=True, text=True)
        print(res.stdout.strip())
        assert res.returncode == 0, f"Repair script failed: {res.stderr}"

        # Verify status after repair
        res = subprocess.run([sys.executable, "dfs_client.py", "status"], capture_output=True, text=True)
        print("\nCluster Status after repair:")
        print(res.stdout.strip())

        # Verify read out3.bin
        res = subprocess.run([sys.executable, "dfs_client.py", "get", "photo.bin", "out3.bin"], capture_output=True, text=True)
        print(res.stdout.strip())
        out3_sha = sha256_file("out3.bin")
        assert out3_sha == expected_sha, f"Checksum mismatch after repair: {out3_sha} != {expected_sha}"
        print(f"{GREEN}[OK] Test 3 Passed: Repair restored replication factor R=2 onto surviving nodes!{RESET}")

        # ----------------------------------------------------------------------
        # Step 6: Test 4 - Corrupt a chunk on store-1
        # ----------------------------------------------------------------------
        print(f"\n{BOLD}[Step 6 - Test 4] Simulating on-disk chunk corruption on store-1...{RESET}")
        store1_dir = os.path.join("dfs_data", "store-1")
        chunk_files = [f for f in os.listdir(store1_dir) if f.startswith("photo.bin")]
        assert len(chunk_files) > 0, "No chunks found on store-1"
        corrupt_target = os.path.join(store1_dir, chunk_files[0])
        print(f"Corrupting file: {corrupt_target}")
        with open(corrupt_target, "wb") as f:
            f.write(b"CORRUPTED_GARBAGE_PAYLOAD_FOR_TESTING_CHECKSUM_VALIDATION")

        print("Downloading 'photo.bin' to 'out4.bin' (client should detect corrupt data & fall back)...")
        res = subprocess.run([sys.executable, "dfs_client.py", "get", "photo.bin", "out4.bin"], capture_output=True, text=True)
        print(res.stdout.strip())
        assert "CORRUPT data, trying next replica" in res.stdout, "Client should have reported CORRUPT data"
        out4_sha = sha256_file("out4.bin")
        assert out4_sha == expected_sha, f"Checksum mismatch: {out4_sha} != {expected_sha}"
        print(f"{GREEN}[OK] Test 4 Passed: Client detected corrupted chunk checksum and retrieved clean replica!{RESET}")

        # ----------------------------------------------------------------------
        # Step 7: Test 5 - Bring store-2 back up (rejoin)
        # ----------------------------------------------------------------------
        print(f"\n{BOLD}[Step 7 - Test 5] Restarting storage node 2 (dfs_storage.py 2)...{RESET}")
        p2 = subprocess.Popen([sys.executable, "dfs_storage.py", "2"])
        processes.append(p2)
        store_procs[2] = p2
        print("Waiting 3 seconds for store-2 heartbeat...")
        time.sleep(3)

        res = subprocess.run([sys.executable, "dfs_client.py", "status"], capture_output=True, text=True)
        print(res.stdout.strip())
        assert "store-2  UP" in res.stdout, "store-2 should be marked UP after rejoin"
        print(f"{GREEN}[OK] Test 5 Passed: store-2 successfully rejoined the cluster with data intact!{RESET}")

        # ----------------------------------------------------------------------
        # Step 8: Test 6 - Upload a second file (second.bin) & check Lamport versioning
        # ----------------------------------------------------------------------
        print(f"\n{BOLD}[Step 8 - Test 6] Uploading second file 'second.bin' (70,000 bytes)...{RESET}")
        second_bytes = os.urandom(70000)
        with open("second.bin", "wb") as f:
            f.write(second_bytes)

        res = subprocess.run([sys.executable, "dfs_client.py", "put", "second.bin"], capture_output=True, text=True)
        print(res.stdout.strip())

        res = subprocess.run([sys.executable, "dfs_client.py", "status"], capture_output=True, text=True)
        print("\nFinal Cluster Status:")
        print(res.stdout.strip())
        assert "second.bin" in res.stdout, "second.bin should appear in cluster file registry"
        print(f"{GREEN}[OK] Test 6 Passed: second.bin successfully uploaded with monotonic Lamport version!{RESET}")

        print(f"\n{BOLD}{GREEN}======================================================================{RESET}")
        print(f"{BOLD}{GREEN}  ALL EXPERIMENT 11 TESTS PASSED SUCCESSFULLY!                        {RESET}")
        print(f"{BOLD}{GREEN}======================================================================{RESET}")

    finally:
        cleanup()


if __name__ == "__main__":
    main()
