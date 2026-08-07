export enum PermissionsEnum {
  OrganizationRead = 'OrganizationRead',
  OrganizationWrite = 'OrganizationWrite',
  OrganizationIAMRead = 'OrganizationIAMRead',
  OrganizationIAMWrite = 'OrganizationIAMWrite',
  OrganizationBillingRead = 'OrganizationBillingRead',
  OrganizationBillingWrite = 'OrganizationBillingWrite',
  OrganizationProjectManagement = 'OrganizationProjectManagement',

  ProjectInstanceRead = 'ProjectInstanceRead',
  ProjectInstanceTerminal = 'ProjectInstanceTerminal',
  ProjectInstanceControl = 'ProjectInstanceControl',
  ProjectInstanceWrite = 'ProjectInstanceWrite',

  ProjectDiskRead = 'ProjectDiskRead',
  ProjectDiskWrite = 'ProjectDiskWrite',

  ProjectSnapshotRead = 'ProjectSnapshotRead',
  ProjectSnapshotWrite = 'ProjectSnapshotWrite',

  ProjectVPCRead = 'ProjectVPCRead',
  ProjectVPCWrite = 'ProjectVPCWrite',

  ProjectSubnetRead = 'ProjectSubnetRead',
  ProjectSubnetWrite = 'ProjectSubnetWrite',

  ProjectEipRead = 'ProjectEipRead',
  ProjectEipWrite = 'ProjectEipWrite',

  ProjectLoadBalancerRead = 'ProjectLoadBalancerRead',
  ProjectLoadBalancerWrite = 'ProjectLoadBalancerWrite',

  ProjectSecurityGroupRead = 'ProjectSecurityGroupRead',
  ProjectSecurityGroupWrite = 'ProjectSecurityGroupWrite',

  ProjectKaaSRead = 'ProjectKaaSRead',
  ProjectKaaSKubeConfig = 'ProjectKaaSKubeConfig',
  ProjectKaaSWrite = 'ProjectKaaSWrite',

  ProjectBaaSRead = 'ProjectBaaSRead',
  ProjectBaaSWrite = 'ProjectBaaSWrite',

  ProjectBucketRead = 'ProjectBucketRead',
  ProjectBucketCredentials = 'ProjectBucketCredentials',
  ProjectBucketWrite = 'ProjectBucketWrite',

  ProjectSSHRead = 'ProjectSSHRead',
  ProjectSSHWrite = 'ProjectSSHWrite',

  ProjectArgoCdRead = 'ProjectArgoCdRead',
}
