#include <cmath>
#include <iomanip>
#include <iostream>
#include <string>
using namespace std;

// BUNKED core: target defaults to 75%. For 75%, this is
// floor((4 * attended - 3 * held) / 3).
int main(int argc, char** argv) {
    if (argc < 3) {
        cerr << "Usage: attendance_engine <held> <attended> [target_percent]\n";
        return 1;
    }
    int held = stoi(argv[1]), attended = stoi(argv[2]);
    double target = argc > 3 ? stod(argv[3]) : 75.0;
    if (held < 0 || attended < 0 || attended > held || target <= 0 || target > 100) {
        cerr << "Invalid attendance values.\n";
        return 2;
    }
    if (held == 0) { cout << "No classes held yet.\n"; return 0; }
    double ratio = target / 100.0;
    double pct = 100.0 * attended / held;
    int skips = max(0, (int)floor((attended - ratio * held) / ratio + 1e-10));
    int recovery = pct < target ? max(0, (int)ceil((ratio * held - attended) / (1.0-ratio) - 1e-10)) : 0;
    cout << fixed << setprecision(2);
    cout << "Attendance: " << pct << "%\n";
    cout << "Missed: " << held-attended << "\n";
    if (pct >= target) cout << "Safe skips: " << skips << "\n";
    else cout << "Consecutive classes to attend: " << recovery << "\n";
}
