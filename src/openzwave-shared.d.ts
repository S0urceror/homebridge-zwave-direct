
declare module OZW {

	interface NodeValue {
		value_id: string;
		node_id: number;
		class_id: number;
		type: "byte" | "decimal" | "bool" | "list" | "short" | "string";
		genre: string;
		instance: number;
		index: number;
		label: string;
		units: string;
		help: string;
		read_only: boolean;
		write_only: boolean,
		is_polled: boolean,
		min: any;
		max: any;
		value: any
	}

	interface ValueID {
		node_id: number;
		class_id: number;
		instance: number;
		index: number;
	}

	interface NodeInfo {
		name: string;
		type: string;
		loc: string;
		manufacturer?: string,
		manufacturerid?: string,
		product?: string,
		producttype?: string,
		productid?: string,
	}


	enum NotificationType {
		MessageComplete = 0,
		Timeout = 1,
		NOP = 2,
		NodeAwake = 3,
		NodeSleep = 4,
		NodeDead = 5,
		NodeALive = 6
	}

	enum LogLevel {
		"No Logging" ,
		"All Messages",
		"Fatal Messages Only",
		"Error Messages and Higher",
		"Warning Messages and Higher",
		"Alert Messages and Higher",
		"Info Messages and Higher",
		"Detailed Messages and Higher",
		"Debug Messages and Higher",
		"Protocol Information and Higher"
	}


	interface DriverConfig {
		UserPath?: string;
		ConfigPath?: string;
		Logging?: boolean;
		ConsoleOutput?: boolean;
		LogFileName?: string;
		AppendLogFile?: boolean;
		SaveLogLevel?: LogLevel;
		QueueLogLevel?: LogLevel;
		DumpTriggerLevel?: LogLevel;
		Associate?: boolean;
		NotifyTransactions?: boolean;
		DriverMaxAttempts?: number;
		SaveConfiguration?: boolean;
		PollInterval?: number;
		IntervalBetweenPolls?: boolean;
		PerformReturnRoutes?: boolean;
		Include?: string;
		Exclude?: string;
		SuppressValueRefresh?: boolean;
		RetryTimeout?: number
		NetworkKey?: string; // 16 Byte Key	Network Key to use for Encrypting Secure Messages over the Network
		EnableSIS?: boolean;
		AssumeAwake?: boolean;
		RefreshAllUserCodes?: boolean;
	}


	interface SwitchPointBasic {
		hours: number
		minutes: number;
	}

	interface SwitchPointFull extends SwitchPointBasic {
		setback: number
	}


	interface SceneInfo {
		sceneid: number
		label: string;
	}

	interface OpenZWave {

		new(config: DriverConfig):OpenZWave;

		// openzwave-config.cc
		setConfigParam();
		requestConfigParam();
		requestAllConfigParams();
	
		// openzwave-controller.cc
		hardReset();
		softReset();
		getControllerNodeId(): number;
		getSUCNodeId(): number;
		isPrimaryController(): boolean;
		isStaticUpdateController(): boolean;
		isBridgeController(): boolean;
		getLibraryVersion(): string;
		getLibraryTypeName(): string;
		getSendQueueCount(): number
	
		// openzwave-driver.cc
		connect(usbPath: string);
		disconnect(usbPath?: string);
	
		// openzwave-groups.cc
		getNumGroups(nodeid: number): number;
		getAssociations(nodeid: number, groupindex: number): number[];
		getMaxAssociations(nodeid: number, groupindex: number): number;
		getGroupLabel(nodeid: number, groupindex: number): string;
		addAssociation(nodeid: number, groupindex: number, toNodeid: number);
		removeAssociation(nodeid: number, groupindex: number, toNodeid: number);
	
		// openzwave-management.cc
		addNode(doSecurity: boolean): boolean;
		removeNode(): boolean;
		removeFailedNode(nodeid: number): boolean;
		hasNodeFailed(nodeid: number): boolean;
		requestNodeNeighborUpdate(nodeid: number): boolean;
		assignReturnRoute(nodeid: number): boolean;
		deleteAllReturnRoutes(nodeid: number): boolean;
		sendNodeInformation(nodeid: number): boolean;
		createNewPrimary(): boolean;
		receiveConfiguration(): boolean;
		replaceFailedNode(nodeid: number): boolean;
		transferPrimaryRole(): boolean;
		requestNetworkUpdate(nodeid: number): boolean;
		replicationSend(nodeid: number): boolean;
		createButton(nodeid: number, buttonid: number): boolean;
		deleteButton(nodeid: number, buttonid: number): boolean;
	  
		// openzwave-network.cc
		testNetworkNode(nodeid: number, nummsg?: number);
		testNetwork(nummsg?: number);
		healNetworkNode(nodeid: number, doRR: number);
		healNetwork(doRR: number);
		
		// openzwave-nodes.cc
		setNodeOn(nodeid: number);
		setNodeOff(nodeid: number);
		setNodeLevel(nodeid: number, level: number);
		switchAllOn();
		switchAllOff();
		pressButton(id: ValueID);

		refreshNodeInfo(nodeid: number);
		requestNodeState(nodeid: number): boolean;
		requestNodeDynamic(nodeid: number): boolean;
		
		// getter-setter pairs
		getNodeLocation(nodeid: number): string;
		setNodeLocation(nodeid: number, param: string);
		getNodeName(nodeid: number): string;
		setNodeName(nodeid: number, param: string);
		getNodeManufacturerName(nodeid: number): string;
		setNodeManufacturerName(nodeid: number, param: string);
		getNodeProductName(nodeid: number): string;
		setNodeProductName(nodeid: number, param: string);

		// getters
		getNodeMaxBaudRate(nodeid: number): number;
		getNodeVersion(nodeid: number): number;
		getNodeBasic(nodeid: number): number;
		getNodeGeneric(nodeid: number): number;
		getNodeManufacturerId(nodeid: number): string;
		getNodeNeighbors(nodeid: number): number[];
		getNodeProductId(nodeid: number): string;
		getNodeProductType(nodeid: number): string;
		getNodeSecurity(nodeid: number): number;
		getNodeSpecific(nodeid: number): number;
		getNodeType(nodeid: number): string;
		isNodeListeningDevice(nodeid: number): boolean;
		isNodeFrequentListeningDevice(nodeid: number): boolean;
		isNodeBeamingDevice(nodeid: number): boolean;
		isNodeRoutingDevice(nodeid: number): boolean;
		isNodeSecurityDevice(nodeid: number): boolean; 
		
		// openzwave-values.cc
		setValue(node_id: number, class_id: number, instance: number, index: number, value:any);
		setValue(valueid: ValueID, value: any);
		
		getNumSwitchPoints(node_id: number, class_id: number, instance: number, index: number):number;
		getNumSwitchPoints(valueid: ValueID): number;
		
		clearSwitchPoints(node_id: number, class_id: number, instance: number, index: number);
		clearSwitchPoints(valueid: ValueID);

	    getSwitchPoint(node_id: number, class_id: number, instance: number, index: number): SwitchPointFull;		
		getSwitchPoint(valueid: ValueID, index: number): SwitchPointFull;

		setSwitchPoint(node_id: number, class_id: number, instance: number, switchPoint: SwitchPointFull);
		setSwitchPoint(valueid: ValueID, switchPoint: SwitchPointFull);

		removeSwitchPoint(node_id: number, class_id: number, instance: number, switchPoint: SwitchPointBasic);
		removeSwitchPoint(valueid: ValueID, switchPoint: SwitchPointBasic);
		
		// openzwave-polling.cc
		enablePoll(nodeid: number, commclass: number, intensity?: number);
		disablePoll(nodeid: number, commclass: number);
		isPolled(nodeid: number, commclass: number);
		getPollInterval(): number;
		setPollInterval(ms: number);
		getPollIntensity();
		setPollIntensity(); 
		
		// openzwave-scenes.cc
		createScene(label: string): number;
		removeScene(sceneid: number);
		getScenes(): SceneInfo[];
		addSceneValue(sceneid: number, value: ValueID);
		removeSceneValue(sceneid: number, value: ValueID);
		sceneGetValues(sceneid: number): ValueID[];
		activateScene(sceneid: number);


		on(event: "connect", listener: (homeid: any) => void);
		on(event: "driver ready", listener: (homeid: any) => void);
		on(event: "driver failed", listener: () => void);
		on(event: "scan complete", listener: () => void);
		
		on(event: "node added", listener: (nodeid: number) => void);
		on(event: "node removed", listener: (nodeid: number) => void);
		on(event: 'node ready', listener: (nodeid: number, nodeinfo: NodeInfo) => void);
		
		on(event: "value added", listener: (nodeid: number, comclass: number, value: NodeValue) => void);
		on(event: "value removed", listener: (nodeid: number, comclass: number, index: number) => void);
		on(event: "value changed", listener: (nodeid: number, comclass: number, value: NodeValue) => void);
	
		on(event: "notification", listener: (nodeid: number, notif: NotificationType, help: string) => void);
		on(event: "controller command", listener: (nodeid: number, returnValue: number, state: number, message: string) => void);

		on(event: string, listener: Function);
	}

  
}



// declare var ozw: OZW.OZWConstructor;

declare module "openzwave-shared" {
    var X: OZW.OpenZWave;
	export = X;
}

