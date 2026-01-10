
# 旋 Perimeter OS: DevLog

## 🏗 Technical Architecture

- **Wagon Differentiation (V4.8)**: 
  - **Standard (Passenger)**: Now defined as the primary "Transit" unit. Capacity set to 10 pax per coach.
  - **Habitat (Residential)**: Re-purposed as a "Stop Trigger". The `animate` loop checks `config.cars.includes('residential')` before initiating terminal docking.
  - **Sorting (Industrial)**: Implemented as a global multiplier for the `resourcesRef.current.scrap` additions.

- **Transit Logic**:
  - **Terminal Accumulation**: `terminalWaitCounts` state updated via a global 8-second interval. Max platform capacity set to 50 pax.
  - **Visual Feedback**: Terminal buildings now feature "Wait Meters" (6 segments) that reflect platform occupancy. **Text labels removed for cleaner desktop integration.**
  - **Transaction Sequence**: 
    1. Collision with terminal dist.
    2. Check for Habitat.
    3. 3-second `isStopped` delay.
    4. Calculate disembarking (Current Pax * Fare * Sorter Bonus).
    5. Calculate boarding (Min of Waiting vs Remaining Capacity).
    6. Log transaction details (Boarded/Disembarked).

- **Hardware Simulation**:
  - CPU load is calculated based on `wagonCount * speed`. 
  - Throttling kicks in at 85% heat to preserve stability, but 92% triggers the "Glitch" visual mode.

## 🗺 Roadmap
- [x] Synergy Loop (Habitat -> Sorting).
- [x] Dynamic Passenger Logic (Conditional Stops).
- [x] Terminal Occupancy Visuals & Logged Transactions.
- [ ] Multi-Monitor support (Boundary calculation research).
- [ ] Weather Effects (CPU "Snow" during high load).
