# **Local-First Architecture Migration — Technical Specification**

**Owner:** OWolf / Ledger Entry  
**Status:** Planning Phase  
**Scope:** Migration from GitHub-first web app to dual-platform architecture: local-first desktop app with real Ledger CLI integration and GitHub-first mobile PWA.

---

## **1. Problem Statement**

### **Current Issues**

The existing GitHub-first architecture creates several limitations:

1. **High Latency** - Every operation requires GitHub API round-trips, making the app feel sluggish
2. **No Real Ledger CLI** - Emulating commands loses the power and accuracy of actual Ledger CLI
3. **Limited Desktop Experience** - Desktop users expect instant responses and full CLI functionality
4. **Mobile Constraint** - GitHub-first approach was designed for mobile but limits desktop capabilities

### **User Experience Problems**

- **Desktop Users**: Frustrated by slow responses and lack of real Ledger CLI commands
- **Mobile Users**: Need optimized touch interface for quick entry, not complex operations
- **Sync Issues**: No offline capability, dependency on GitHub API availability

---

## **2. Proposed Solution**

### **Dual-Platform Architecture**

**Desktop App (Local-First)**

```
Local Files → Instant Ledger CLI → Background GitHub Sync
```

**Mobile PWA (GitHub-First)**

```
Mobile Input → Direct GitHub → Desktop Sync on Open
```

### **Core Principles**

1. **Desktop**: Local-first with real Ledger CLI integration
2. **Mobile**: GitHub-first with optimized touch interface
3. **Sync**: Seamless bidirectional synchronization
4. **Offline**: Desktop works offline, mobile queues when offline
5. **Performance**: Desktop is lightning fast, mobile is optimized for entry

---

## **3. Architecture Overview**

### **3.1 Desktop App (Tauri)**

**Primary Data Source**: Local Git repository
**Performance**: Instant responses, real Ledger CLI commands
**Sync**: Background push to GitHub, pull on startup

```typescript
interface DesktopApp {
  localRepo: LocalGitRepo; // Primary data source
  ledgerCli: LedgerCLI; // Real CLI integration
  githubSync: BackgroundSync; // Silent GitHub updates
  fileWatcher: FileSystemWatcher; // Detect local changes
  conflictResolver: ConflictResolver; // Handle sync conflicts
}
```

### **3.2 Mobile PWA (Next.js)**

**Primary Data Source**: GitHub repositories
**Performance**: Optimized for quick entry and touch interaction
**Sync**: Immediate push to GitHub, pull when desktop opens

```typescript
interface MobileApp {
  githubApi: GitHubAPI; // Direct GitHub operations
  offlineQueue: TransactionQueue; // Queue when offline
  desktopSync: SyncOnOpen; // Pull changes when desktop opens
  touchOptimized: TouchInterface; // Mobile-first UI components
}
```

### **3.3 Shared Components**

**Core Logic**: Natural language processing, rules engine, validation
**Data Models**: Account structures, transaction formats, rules schemas
**Sync Layer**: Bidirectional synchronization utilities

```typescript
interface SharedComponents {
  nlpEngine: NaturalLanguageProcessor;
  rulesEngine: RulesEngine;
  validation: ValidationEngine;
  syncUtils: SyncUtilities;
  dataModels: DataModels;
}
```

---

## **4. Implementation Strategy**

### **4.1 Migration Approach**

**Incremental Migration** - Preserve existing functionality while building new architecture:

1. **Keep existing web app** as the mobile PWA (already GitHub-first)
2. **Create new Tauri desktop app** in separate directory
3. **Share core logic** between both platforms
4. **Implement sync layer** that both apps can use
5. **Gradual user migration** from web to appropriate platform

### **4.2 Project Structure**

```
ledger-entry/
├── web/                    # Existing Next.js app (mobile PWA)
│   ├── src/
│   ├── public/
│   └── package.json
├── desktop/               # New Tauri app (local-first)
│   ├── src/
│   ├── src-tauri/
│   └── package.json
├── shared/                # Shared logic between platforms
│   ├── nlp/              # Natural language processing
│   ├── rules/            # Rules engine
│   ├── validation/       # Validation logic
│   ├── sync/             # Sync utilities
│   └── types/            # Shared TypeScript types
├── docs/                  # Existing documentation
└── package.json           # Root package.json for workspace
```

### **4.3 Implementation Phases**

**Phase 1: Desktop Foundation (Weeks 1-2)**

- Create Tauri desktop app structure
- Implement local Git repository management
- Add real Ledger CLI integration
- Basic file operations (read/write ledger files)

**Phase 2: Desktop Core Features (Weeks 3-4)**

- Natural language input processing
- Transaction creation and editing
- Account management
- Basic reporting with real Ledger CLI

**Phase 3: Sync Infrastructure (Weeks 5-6)**

- Background GitHub sync from desktop
- Pull latest changes when desktop opens
- Conflict detection and resolution
- Sync status indicators

**Phase 4: Mobile Optimization (Weeks 7-8)**

- Optimize existing web app for mobile PWA
- Touch-optimized interface
- Offline queue for transactions
- Desktop sync integration

**Phase 5: Advanced Features (Weeks 9-10)**

- Bidirectional sync
- Conflict resolution UI
- Performance optimization
- User migration tools

---

## **5. Technical Implementation**

### **5.1 Desktop App (Tauri)**

**Local Repository Management**

```typescript
class LocalRepoManager {
  private repoPath: string;
  private git: SimpleGit;

  async initializeRepo(): Promise<void> {
    // Initialize or clone from GitHub
  }

  async syncToGitHub(): Promise<void> {
    // Background sync to GitHub
  }

  async pullFromGitHub(): Promise<void> {
    // Pull latest changes on startup
  }
}
```

**Ledger CLI Integration**

```typescript
class LedgerCLI {
  private ledgerPath: string;

  async executeCommand(command: string, args: string[]): Promise<string> {
    // Execute real Ledger CLI commands
  }

  async getBalance(accounts?: string[]): Promise<BalanceResult> {
    // Real balance command
  }

  async getRegister(accounts?: string[]): Promise<RegisterResult> {
    // Real register command
  }
}
```

### **5.2 Mobile PWA (Next.js)**

**GitHub Integration**

```typescript
class GitHubAPI {
  async createTransaction(entry: TransactionEntry): Promise<void> {
    // Direct GitHub API calls
  }

  async getLatestFiles(): Promise<LedgerFiles> {
    // Fetch latest files from GitHub
  }

  async syncToDesktop(): Promise<void> {
    // Trigger desktop sync
  }
}
```

**Offline Queue**

```typescript
class OfflineQueue {
  private queue: TransactionEntry[];

  async queueTransaction(entry: TransactionEntry): Promise<void> {
    // Queue transaction when offline
  }

  async processQueue(): Promise<void> {
    // Process queued transactions when online
  }
}
```

### **5.3 Sync Layer**

**Bidirectional Sync**

```typescript
class SyncManager {
  async syncDesktopToGitHub(): Promise<SyncResult> {
    // Push local changes to GitHub
  }

  async syncGitHubToDesktop(): Promise<SyncResult> {
    // Pull GitHub changes to local
  }

  async resolveConflicts(conflicts: Conflict[]): Promise<Resolution[]> {
    // Handle sync conflicts
  }
}
```

---

## **6. User Experience Flow**

### **6.1 Desktop User Experience**

```
1. User opens desktop app
2. App pulls latest changes from GitHub (if online)
3. User works with local files (instant responses)
4. Real Ledger CLI commands execute immediately
5. Background sync pushes changes to GitHub
6. User can work offline indefinitely
```

### **6.2 Mobile User Experience**

```
1. User opens mobile PWA
2. App fetches latest files from GitHub
3. User enters transactions with touch-optimized interface
4. Transactions immediately saved to GitHub
5. Desktop app will sync changes when opened
6. Offline transactions queued for later sync
```

### **6.3 Cross-Platform Sync**

```
Desktop → GitHub → Mobile: Immediate
Mobile → GitHub → Desktop: On desktop startup
Conflict Resolution: Last-write-wins with clear indicators
```

---

## **7. Benefits of This Architecture**

### **7.1 Performance Benefits**

- **Desktop**: Instant responses, real Ledger CLI commands
- **Mobile**: Optimized for quick entry, minimal latency
- **Sync**: Background operations don't block user interaction

### **7.2 User Experience Benefits**

- **Desktop Users**: Get the power and speed they expect
- **Mobile Users**: Get touch-optimized interface for quick entry
- **Cross-Platform**: Seamless data synchronization

### **7.3 Technical Benefits**

- **Offline Support**: Desktop works without internet
- **Real CLI**: Full Ledger CLI compatibility and accuracy
- **Scalable**: Each platform optimized for its use case
- **Maintainable**: Clear separation of concerns

---

## **8. Migration Strategy**

### **8.1 User Migration Path**

1. **Existing Users**: Can continue using web app while desktop develops
2. **Desktop Users**: Migrate to Tauri app for better performance
3. **Mobile Users**: Continue using optimized PWA
4. **Data Continuity**: No migration needed, both apps work with same repos

### **8.2 Development Migration**

1. **Preserve Existing Code**: Keep all authentication, GitHub integration, UI components
2. **Share Core Logic**: Extract NLP, rules engine, validation to shared modules
3. **Incremental Development**: Build desktop app alongside existing web app
4. **Testing**: Test sync between existing web app and new desktop app

---

## **9. Success Metrics**

### **9.1 Performance Metrics**

- **Desktop**: < 100ms response time for local operations
- **Mobile**: < 500ms response time for GitHub operations
- **Sync**: < 5 seconds for background sync operations

### **9.2 User Experience Metrics**

- **Desktop**: Real Ledger CLI command compatibility
- **Mobile**: Touch-optimized interface adoption
- **Cross-Platform**: Sync success rate > 99%

### **9.3 Technical Metrics**

- **Offline Capability**: Desktop works without internet
- **Conflict Resolution**: Automatic resolution rate > 95%
- **Data Integrity**: Zero data loss during sync operations

---

## **10. Risk Mitigation**

### **10.1 Technical Risks**

- **Sync Conflicts**: Implement robust conflict resolution
- **Data Loss**: Comprehensive backup and recovery mechanisms
- **Performance**: Optimize for both platforms independently

### **10.2 User Experience Risks**

- **Migration Complexity**: Provide clear migration path and tools
- **Feature Parity**: Ensure both platforms have necessary features
- **Learning Curve**: Maintain familiar interfaces where possible

---

## **11. Conclusion**

This dual-platform architecture solves the fundamental tension between mobile constraints and desktop power. By providing:

- **Desktop**: Local-first with real Ledger CLI integration
- **Mobile**: GitHub-first with optimized touch interface
- **Sync**: Seamless bidirectional synchronization

We create an optimal experience for both platforms while preserving all existing functionality and user data. The incremental migration approach minimizes risk while maximizing user benefit.

---

**Next Steps:**

1. Review and approve this architecture specification
2. Begin Phase 1 implementation (Desktop Foundation)
3. Set up project structure with shared components
4. Implement local Git repository management
5. Integrate real Ledger CLI functionality
