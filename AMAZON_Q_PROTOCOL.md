# 🤖 Amazon Q Session Protocol & Handover Instructions

## 📋 **Session Handover Protocol**

### **For Next Amazon Q Session:**

**IMPORTANT**: Use this prompt to catch up on the CKA Simulator project:

```
I'm continuing work on the CKA Simulator v2.0 project. Please read the PROJECT_SUMMARY.md file in the current directory to understand the complete project status, architecture, and current infrastructure. The project is a production-ready Kubernetes certification practice platform with real AWS cluster integration.

Key points to understand:
1. System is fully operational with real kubectl command execution
2. Uses AWS EC2 instances that may have changed IP addresses since last session
3. Architecture: Browser → Vercel → AWS EC2 SSH Proxy → Kubernetes Cluster
4. Current infrastructure details are in PROJECT_SUMMARY.md
5. All code is in GitHub repo: https://github.com/Jeffrey-Xu/cka-exam-simulator

Please confirm you've reviewed the project summary and are ready to continue development.
```

---

## 🤝 **Professional Interaction Protocol**

### **Core Principles**

1. **Always Verify First**
   - ✅ Check current system status before making claims
   - ✅ Verify infrastructure state before proceeding
   - ✅ Confirm understanding before implementing changes
   - ❌ Never assume previous session state

2. **Stage-by-Stage Updates**
   - ✅ Provide progress updates at each major step
   - ✅ Seek approval before proceeding to next phase
   - ✅ Explain what will be done before doing it
   - ✅ Confirm completion before moving forward

3. **Explicit Consent Required**
   - ✅ Ask permission before making infrastructure changes
   - ✅ Confirm before spending money (AWS resources)
   - ✅ Seek approval for architectural modifications
   - ✅ Get consent before deleting or modifying existing resources

4. **Professional Communication**
   - ✅ Use clear, technical language appropriate for developers
   - ✅ Provide comprehensive explanations with context
   - ✅ Include relevant code examples and commands
   - ✅ Maintain professional tone throughout interaction

---

## 🔄 **Standard Session Workflow**

### **1. Session Initialization**
```
1. Read PROJECT_SUMMARY.md for current status
2. Check AWS infrastructure state
3. Verify application functionality
4. Confirm understanding with user
5. Ask for specific objectives for this session
```

### **2. Infrastructure Verification**
```
1. Check EC2 instance status and IP addresses
2. Verify SSH connectivity to all nodes
3. Test WebSocket server functionality
4. Confirm Kubernetes cluster health
5. Report any changes or issues found
```

### **3. Development Process**
```
For each major task:
1. Explain what will be done and why
2. Show the approach and expected outcome
3. Seek approval before implementation
4. Execute the task with progress updates
5. Verify completion and test functionality
6. Report results and seek confirmation to continue
```

### **4. Session Conclusion**
```
1. Summarize all changes made
2. Update documentation if needed
3. Provide status of all systems
4. Note any issues or recommendations
5. Prepare handover notes for next session
```

---

## 📊 **Current Project Context**

### **Project Status: COMPLETED & OPERATIONAL**
- **System**: Fully functional CKA exam simulator
- **Architecture**: Browser → Vercel → AWS EC2 → Kubernetes
- **Infrastructure**: 3 AWS EC2 instances (ssh-proxy, master01, worker01)
- **Functionality**: Real kubectl commands on live cluster
- **Security**: WSS with SSL/TLS encryption

### **Key Infrastructure Details**
- **Region**: us-east-1
- **SSH Key**: my-ec2-key.pem
- **Security Group**: sg-04a5d462c054c6be3
- **VPC**: vpc-0c96f604ea7042c65
- **Frontend**: https://cka-simulator-b9l2n6wrb-jeffrey-xus-projects-8e6cab13.vercel.app

### **Critical IP Dependencies**
⚠️ **IMPORTANT**: EC2 instances have dynamic IPs that change on restart
- SSH Proxy: Currently 34.201.132.19 (may change)
- Master01: Currently 100.27.28.215 (may change)
- Worker01: Currently 54.145.132.72 (may change)

**Always check current IPs and update code accordingly**

---

## 🛠️ **Common Tasks & Procedures**

### **Starting Stopped Infrastructure**
```bash
# 1. Start EC2 instances
aws ec2 start-instances --instance-ids i-0b9dd40cd97334586 i-028a33e2124c881f5 i-068e8e4aeac1aaf35

# 2. Get new IP addresses
aws ec2 describe-instances --instance-ids i-0b9dd40cd97334586 i-028a33e2124c881f5 i-068e8e4aeac1aaf35

# 3. Update code with new IPs
# 4. Regenerate SSL certificate
# 5. Restart services
# 6. Test functionality
```

### **Verifying System Health**
```bash
# Check SSH proxy
curl -k https://PROXY-IP:3001/health

# Check Kubernetes cluster
ssh -i ~/.ssh/my-ec2-key.pem ubuntu@MASTER-IP "kubectl get nodes"

# Test WebSocket connection
# Use browser developer tools to monitor WebSocket traffic
```

### **Code Update Locations for IP Changes**
1. `src/components/terminal/XTermComponent.tsx` - WebSocket URL
2. `ssh-proxy-server/.env` - K8S_MASTER_IP
3. `ssh-proxy-server/server-https.js` - SSL certificate paths

---

## 🚨 **Critical Reminders**

### **Before Making Changes**
- ✅ Always ask permission for infrastructure modifications
- ✅ Confirm understanding of current system state
- ✅ Explain potential costs or impacts
- ✅ Provide rollback plan if needed

### **During Development**
- ✅ Provide regular progress updates
- ✅ Test changes incrementally
- ✅ Maintain backup of working configurations
- ✅ Document all modifications made

### **After Completion**
- ✅ Verify all functionality works end-to-end
- ✅ Update documentation with any changes
- ✅ Provide clear status report
- ✅ Note any issues or recommendations

---

## 📝 **Session Documentation Template**

```markdown
## Amazon Q Session - [Date]

### Objectives
- [ ] Objective 1
- [ ] Objective 2

### Infrastructure Status
- SSH Proxy: [IP] - [Status]
- Master01: [IP] - [Status]  
- Worker01: [IP] - [Status]

### Changes Made
1. Change 1 - [Description] - [Status]
2. Change 2 - [Description] - [Status]

### Issues Encountered
- Issue 1 - [Description] - [Resolution]

### Next Steps
- [ ] Task 1
- [ ] Task 2

### Handover Notes
- [Important information for next session]
```

---

## 🎯 **Success Criteria**

### **Professional Session Standards**
- ✅ Clear communication throughout
- ✅ Explicit approval for all major actions
- ✅ Comprehensive documentation of changes
- ✅ Verification of functionality before conclusion
- ✅ Proper handover preparation

### **Technical Standards**
- ✅ All systems tested and verified working
- ✅ No breaking changes without approval
- ✅ Proper error handling and rollback procedures
- ✅ Security best practices maintained
- ✅ Cost optimization considered

---

**This protocol ensures consistent, professional, and effective collaboration across Amazon Q sessions while maintaining the integrity and functionality of the CKA Simulator project.**