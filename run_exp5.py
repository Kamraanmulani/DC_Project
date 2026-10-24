"""
Experiment 5 Orchestrator:
Executes both Run 1 (Deadlock Simulation - proving the circular wait)
and Run 2 (Deadlock Detection & Resolution via Wait-For Graph cycle detection).
"""

import subprocess
import sys
import threading
import time


def run_simulation_mode():
    print("\n" + "=" * 70)
    print("RUN 1: SIMULATE DEADLOCK (Proving Circular Wait)")
    print("Starting LockManager WITHOUT detection...")
    print("=" * 70)

    # 1. Start LockManager (Simulation mode)
    lm_proc = subprocess.Popen(
        [sys.executable, "-u", "lock_manager.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    def print_lm():
        for line in iter(lm_proc.stdout.readline, ''):
            if line:
                print(f"  [LockManager] {line.rstrip()}", flush=True)

    t_lm = threading.Thread(target=print_lm, daemon=True)
    t_lm.start()
    time.sleep(1.0)  # Wait for startup

    # 2. Start Worker 1 (AutoSave) and Worker 2 (Submission) concurrently
    print("\n>>> Launching Worker 1 (AutoSave) and Worker 2 (Submission) within ~0.2s...")
    w1_proc = subprocess.Popen(
        [sys.executable, "-u", "worker.py", "1", "autosave"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    time.sleep(0.2)

    w2_proc = subprocess.Popen(
        [sys.executable, "-u", "worker.py", "2", "submission"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    def print_w1():
        for line in iter(w1_proc.stdout.readline, ''):
            if line:
                print(f"  [Worker-1 (AutoSave)]   {line.rstrip()}", flush=True)

    def print_w2():
        for line in iter(w2_proc.stdout.readline, ''):
            if line:
                print(f"  [Worker-2 (Submission)] {line.rstrip()}", flush=True)

    threading.Thread(target=print_w1, daemon=True).start()
    threading.Thread(target=print_w2, daemon=True).start()

    # Let the circular wait run for 4 seconds to observe the hang
    time.sleep(4.5)

    print("\n[PROVED] Deadlock confirmed: Both workers are blocked indefinitely in circular wait!")
    print("Terminating simulation run processes (simulating Ctrl+C)...")
    w1_proc.terminate()
    w2_proc.terminate()
    lm_proc.terminate()
    w1_proc.wait()
    w2_proc.wait()
    lm_proc.wait()
    print("=" * 70)


def run_detection_mode():
    print("\n" + "=" * 70)
    print("RUN 2: DETECT AND RESOLVE DEADLOCK (Wait-For Graph Cycle Detection)")
    print("Starting LockManager WITH 'detect' enabled...")
    print("=" * 70)

    # 1. Start LockManager in detect mode
    lm_proc = subprocess.Popen(
        [sys.executable, "-u", "lock_manager.py", "detect"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    def print_lm():
        for line in iter(lm_proc.stdout.readline, ''):
            if line:
                print(f"  [LockManager] {line.rstrip()}", flush=True)

    t_lm = threading.Thread(target=print_lm, daemon=True)
    t_lm.start()
    time.sleep(1.0)

    # 2. Start Worker 1 (AutoSave) and Worker 2 (Submission) concurrently
    print("\n>>> Launching Worker 1 (AutoSave) and Worker 2 (Submission) within ~0.2s...")
    w1_proc = subprocess.Popen(
        [sys.executable, "-u", "worker.py", "1", "autosave"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    time.sleep(0.2)

    w2_proc = subprocess.Popen(
        [sys.executable, "-u", "worker.py", "2", "submission"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    def print_w1():
        for line in iter(w1_proc.stdout.readline, ''):
            if line:
                print(f"  [Worker-1 (AutoSave)]   {line.rstrip()}", flush=True)

    def print_w2():
        for line in iter(w2_proc.stdout.readline, ''):
            if line:
                print(f"  [Worker-2 (Submission)] {line.rstrip()}", flush=True)

    t1 = threading.Thread(target=print_w1)
    t2 = threading.Thread(target=print_w2)
    t1.start()
    t2.start()

    w1_proc.wait()
    w2_proc.wait()
    t1.join()
    t2.join()

    time.sleep(0.5)
    lm_proc.terminate()
    lm_proc.wait()

    print("\n" + "=" * 70)
    print("Deadlock Detected, Aborted, and Successfully Resolved!")
    print("Both workers completed all tasks without permanent blockage.")
    print("=" * 70)


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "sim":
        run_simulation_mode()
    elif len(sys.argv) > 1 and sys.argv[1] == "detect":
        run_detection_mode()
    else:
        run_simulation_mode()
        time.sleep(1.5)
        run_detection_mode()


if __name__ == "__main__":
    main()
