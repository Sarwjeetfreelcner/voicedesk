#!/bin/bash
# Block SIP Attacker and Reduce Log Spam

echo "🛡️ Blocking attacker IP: 23.94.171.74"

# Block the attacker
sudo iptables -A INPUT -s 23.94.171.74 -j DROP
echo "✅ Attacker IP blocked"

# Save iptables rules
sudo mkdir -p /etc/iptables
sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null
echo "✅ Firewall rules saved"

# Show blocked IPs
echo ""
echo "📋 Blocked IPs:"
sudo iptables -L INPUT -n | grep 23.94.171.74

echo ""
echo "✅ Done! The spam should stop now."
echo ""
echo "To unblock later (if needed):"
echo "  sudo iptables -D INPUT -s 23.94.171.74 -j DROP"

