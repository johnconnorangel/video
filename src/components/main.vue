<template>
  <div class="main">
    <div class="head head-1">
	    <Row>
		    <Col span='7'>{{ msg }}</Col>
	    </Row>
    </div>

    <div class="tabs">
      <Menu mode="horizontal"  active-name="1" @on-select="tabchange">
        <MenuItem name="1">
          <Icon type="ios-paper"></Icon>
          视频元数据
        </MenuItem>
        <MenuItem name="2">
          <Icon type="usb"></Icon>
          设备
        </MenuItem>
        <MenuItem name="3">
          <Icon type="ios-people"></Icon>
          应用
        </MenuItem>
      </Menu>
    </div>
    
    <div class='content'v-if="isfile">
      <div class='filetree'>
        <Tree :data='filesystem' @on-select-change='file_tree_select_req' @on-toggle-expand='file_tree_toggle_req'>
        </Tree> 
      </div>
      <div class='fileview'>
        <Table :columns='columns1' :data='fileinfo' ></Table>
      </div>
    </div>
    <div class='content' v-if="isdevice">
      <div class="uploadview">
        <Button type='text' @click="updatedevicestate"><Icon type="loop" size='20'></Icon></Button>
      </div>
      <div class="deviceview">
        <div>
          <Table :columns='columns3' :data='deviceinfo'></Table>
        </div>
      </div>
    </div>
    <div class='content' v-if="isapp">
      <div class='filetree'>
        <div class="uploadview">
          <Upload  action='localhost:8080/Application?type=upload' @before-upload="uploadhandler">
            <Button type="text" icon="ios-cloud-upload-outline">上传</Button>
          </Upload>
        </div>
        <Tree :data='filesystem'  @on-select-change='file_tree_select_app' @on-toggle-expand='file_tree_toggle_app'>
        </Tree> 
      </div>
      <div class='fileview' style="overflow:hidden">
        <div class="appview">
          <Table :columns='columns2' :data='filenameandoper'></Table>
        </div>
      </div>
    </div>
    <div class="mask" v-if='ismask'></div>
    <div v-if="load" class="load">
      <Spin fix>
        <Icon type="load-c" size='18' class="demo-spin-icon-load"></Icon>
        <div>读取中...</div>
      </Spin>
    </div>
    <div v-if='isvmd' class="pop vmdview">
      <div class='vmdhead'>
        <div class="idictfont common">文件头信息</div>
        <div class="vmdheadview">
          <p><div class="line-40">URL：</div><div class="line-40">{{vmdinfo.url}}</div></p>
          <p><div class="line-40">I帧数目：</div><div class="line-40">{{vmdinfo.Inum}}</div></p>
          <p><div class="line-40">帧率：</div><div class="line-40">{{vmdinfo.fps}}</div></p>
          <p><div class="line-40">VMD所在单元：</div><div class="line-40">{{vmdinfo.cluster}}</div></p>
        </div>
      </div>
      <div class="idict">
        <div class="idictfont common">I帧字典</div>
        <div class='idictview'>
          <Table :columns='columns6' :data='Idictinfo'></Table>
        </div>
      </div>
      <div class="vmdexit">
        <Button type="text" @click="exitvmd"><Icon size='38' type="ios-close-outline"></Icon></Button>
      </div>
    </div>
    <div class='content' v-if="ischeckI">
      <div class="filetree" style="text-align:center">
        <RadioGroup v-model='way' @on-change="selectframemod">
          <Radio label='frameno'>帧号</Radio>
          <Radio label='time'>时间</Radio>
        </RadioGroup>
        <div style='height:20px'></div>
        <Input v-model='frameno' :placeholder='remid1'></Input>
        <div style='height:10px'></div>
        <Input v-model='framenum' :placeholder='remid2'></Input>
        <div style="padding-top:10px; text-align:center">
          <Button type="primary" @click="checkframe">查看</Button>
          <Button type="primary" @click="returnapp">返回</Button>
        </div>
      </div>
      <div class="fileview">
        {{picturetitle}}
        <img v-for="path in picture_path_list" :src="path" width="30%" height="30%" />
      </div>
    </div>
  </div>
</template>
<script>
//元数据存储，元数据构建，元数据索引
export default {
  data () {
    return {
      isfile:true,
      isdevice:false,
      isapp:false,
      modal:false,
      isvmd:false,
      isapp:false,
      ischeckI:false,
      currentfile:'',
      msg:'视频大数据管理',
      remid1:'请输入帧号',
      remid2:'请输入生成的图片(帧)数',
      url:'',
      frameno:'',
      framenum:'',
      way:'frameno',
      tree_item_select:[],
      picturetitle:'',
      picture_path_list:[],
      load:false,
      ismask:false,
      operation_menu:true,
      fileinfo:[
      ],
      filenameandoper:[
      ],
      vmdinfo:{},
      deviceinfo:[

      ],
      indexserverinfo:[
      ],
      taskserverinfo:[
      ],
      filesystem:[
      {
        title:'yty',
        expand:false,
        parent:null,
        children:[
        {'title':'空'}
        ]
      }
      ],
      totalpath_req:'',
      totalpath_app:'',
      Idictinfo:[
      ],
      columns1:[
      {
        title:'视频',
        key:'name',
        align:'center'
      },
      {
        title:'大小/MB',
        key:'size',
        align:'center'
      },
      {
        title:'修改日期',
        key:'revisedate',
        align:'center'
      },
      {
        title:'编码格式',
        key:'fomat',
        align:'center'
      },
      {
        title:'元数据操作',
        key:'operation',
        align:'center',
        render:(h,param)=>{
          return h("div",[
            h("Tooltip",{
                props:{
                  content:'查看',
                  placement:'top'
                }
              },[
              h("Button",{
                props:{
                  type:'text'
                },
                on:{
                  click:() =>{
                    this.vmd_btn(param.index);
                  }
                }
              },[
                h("Icon",{
                    props:{
                    type:'eye',
                    size:'25'
                  }
                })
              ])
            ]),h("Tooltip",{
                props:{
                  content:'生成',
                  placement:'top'
                }
              },[
              h("Button",{
                props:{
                  type:'text'
                },
                on:{
                  click:() =>{
                    this.genvmd(this.fileinfo[param.index].name);
                  }
                }
              },[
                h("Icon",{
                    props:{
                    type:'images',
                    size:'25'
                  }
                })
              ])
            ]),h("Tooltip",{
                props:{
                  content:'删除',
                  placement:'top'
                }
              },[
              h("Button",{
                props:{
                  type:'text'
                },
                on:{
                  click:() =>{
                    this.delvmd(this.fileinfo[param.index].name);
                  }
                }
              },[
                h("Icon",{
                    props:{
                    type:'trash-a',
                    size:'25'
                  }
                })
              ])
            ])
            ]
          );
        }
      }
      ],
      columns2:[
      {
        title:'视频',
        key:'name',
        align:'center'
      },
      {
        title:'大小/MB',
        key:'size',
        align:'center'
      },
      {
        title:'修改日期',
        key:'revisedate',
        align:'center'
      },
      {
        title:'编码格式',
        key:'fomat',
        align:'center'
      },
      {
        title:'应用',
        key:'operation',
        align:'center',
        render:(h,param)=>{
          return h("div",[
            h("Tooltip",{
                props:{
                  content:'查看帧',
                  placement:'top'
                }
              },[
              h("Button",{
                props:{
                  type:'text'
                },
                on:{
                  click:() =>{
                    this.checkI(param.index);
                  }
                }
              },[
                h("Icon",{
                    props:{
                    type:'eye',
                    size:'25'
                  }
                })
              ])
            ])
            ]
          );
        }
      }
      ],
      columns3:[
      {
        title:'模块',
        key:'type',
        align:'center'
      },
      {
        title:'ip',
        key:'ip',
        align:'center'
      },
      {
        title:'端口',
        key:'port',
        align:'center'
      },
      {
        title:'可用内存（GB）',
        key:'mem',
        align:'center'
      },
      {
        title:' ',
        key:'detail',
        render:(h,param)=>{
          return h("Button",{
            props:{
              type:'text'
            },
            on:{
              click:() =>{
                this.vmd_btn(param.index);
              }
            }
          },'详情');
        }
      }
      ],
      columns6:[
      {
        title:'起始I帧号',
        key:'Inum',
        align:'center'
      },
      {
        title:'偏移量',
        key:'offset',
        align:'center'
      }
      ]
    }
  },
  methods:{
    uploadhandler(file)
    {
      alert('3');
      console.log(response);
      console.log(file);
      return false ;
      /*var _this=this;
      this.$http.get('Application?type=upload&url='+file.name).then(function(response){
          _this.$Message.info('上传成功！');
        }
      ).catch(function(){
        _this.$Message.info('上传失败！');
      });*/
    },
    closeall()
    {
      this.isfile=false;
      this.isdevice=false;
      this.isapp=false;
      this.ischeckI=false;
    },
    tabchange(name){
      this.closeall();
      if(name==1)
      {
        this.isfile=true;
        this.file_syetem_update(this.filesystem[0],1);
        this.fileinfo=[];
      }
      else if(name==2){
        this.isdevice=true;
        this.updatedevicestate();
      }
      else if(name==3){
        this.isapp=true;
        this.file_syetem_update(this.filesystem[0],2);
        this.filenameandoper=[];
      }
    },
    filldevicelist(res,data,type)
    {
      for(var i=0; i<data.length; i++)
      {
        var item={};
        var host;
        item.type=type;
        item.unit=data[i].cluster;
        var host=data[i].active.split(':');
        item.ip=host[0];
        item.port=host[1];
        item.mem=(data[i].memory/(1024*1024*1024*1024));
        res.push(item);
      }
    },
    updatedevicestate()
    {
      var _this= this;
      var res=[];
      this.$http.get('DeviceListen?type=redis').then(function(response){
          console.log(response.data);
          _this.filldevicelist(res,response.data,'vmd存储单元');
        }
      ).catch(function(){});

      this.$http.get('DeviceListen?type=index').then(function(response){
         _this.filldevicelist(res,response.data,'vmd索引单元');
      });
      this.$http.get('DeviceListen?type=task').then(function(response){
         _this.filldevicelist(res,response.data,'vmd构建单元');
      });
      this.deviceinfo=res;
    },
    mask()
    {
      this.ismask=true;
    },
    unmask()
    {
      this.ismask=false;
    },
    tranverpath1(node)
    {
      if(node.parent!=null)
        this.tranverpath1(node.parent);
      this.totalpath_req=this.totalpath_req+node.title+'/';
    },
    gettotalpath1(node)
    {
      this.totalpath_req='';  //竟然无效
      this.tranverpath1(node);
      //return this.totalpath;  这里返回后变量接收不到值？？？？？？？？？？？？？
    },
    tranverpath2(node)
    {
      if(node.parent!=null)
        this.tranverpath2(node.parent);
      this.totalpath_app=this.totalpath_app+node.title+'/';
    },
    gettotalpath2(node)
    {
      this.totalpath_app='';  //竟然无效
      this.tranverpath2(node);
      //return this.totalpath;  这里返回后变量接收不到值？？？？？？？？？？？？？
    },

    file_tree_select_req:function(item){
      if(item.length>0)
        this.tree_select_item=item[0];
      this.file_info_update(this.tree_select_item,1);
    },
    file_tree_toggle_req:function(item){
      if(item.expand)
        this.file_syetem_update(item,1);
      this.file_info_update(item,1);
    },
    file_tree_select_app:function(item){
      if(item.length>0)
        this.tree_select_item=item[0];
      this.file_info_update(this.tree_select_item,2);
    },
    file_tree_toggle_app:function(item){
      if(item.expand)
        this.file_syetem_update(item,2);
      this.file_info_update(item,2);
    },
    devicedetail(index)
    {

    },
    showappbtn(index){
      var btn = document.getElementsByClassName('font-60')[index];
      btn.style.display='block';
      btn.parentNode.style.background='#E0FFFF';
    },
    exitappbtn(index)
    {
      var btn = document.getElementsByClassName('font-60')[index];
      btn.style.display='none';
      btn.parentNode.style.background='#fff';
    },
    download(file){
      var a=document.getElementsByTagName("a")[0];
      var request_path='http://localhost:8080/VideoSystem/'+ 'Application?path='+this.totalpath_app+file+'&type=download';
      console.log(request_path);
      a.href=request_path;
      a.click();
    },
    checkI(index){
      let file=this.filenameandoper[index].name;
      this.closeall();
      this.picture_path_list=[];
      this.viewtitle='查看帧';
      this.currentfile=file;
      this.frameno='';
      this.framenum='';
      this.ischeckI=true;
    },
    genvmd(file){
      var _this=this;
      this.$http.get('Application?type=genvmd&path='+this.totalpath_req+file).then(function(response){
          console.log(response.data);
          if(response.data=='no')
            _this.$Message.error('vmd已存在！');
          else
            _this.$Message.info('已加入到任务队列！');
        }
      ).catch(
      );
    },
    delvmd(file){
      var _this=this;
      this.$http.get('Application?type=delvmd&path='+this.totalpath_req+file).then(function(response){
        if(response.data=='no')
          _this.$Message.error('vmd已被删除！');
        else
          _this.$Message.info('已加入到任务队列！');
      });
    },


    exitvmd(){
      this.isdevice=false;
      this.isvmd=false;
      this.unmask();
    },
	  file_syetem_update(node,type){
      var temp=[];
      var totalpath;
      if(type==1){
        this.gettotalpath1(node);
        totalpath = this.totalpath_req;
      }
      else{
        this.gettotalpath2(node);
        totalpath=this.totalpath_app;
      }
      var request_path = 'Dir?path='+totalpath; 
      console.log(request_path);
      this.$http.get(request_path).then(function(response){
        for(var i=0; i<response.data.length; i++){
            var item={};
            item.title=response.data[i];
            item.expand=false;
            item.parent=node;
            item.children=[{'title':'空'}];
            temp.push(item);
          }
        }).catch(function(error){
      });
      node.expand=true;
      node.children=temp;
  	},
    file_info_update(node,type){
      var temp=[];
      var totalpath;
      if(type==1){
        this.gettotalpath1(node);
        totalpath = this.totalpath_req;
      }
      else{
        this.gettotalpath2(node);
        totalpath=this.totalpath_app;
      }
      var request_path = 'Fileinfo?path='+totalpath;
      this.$http.get(request_path).then(function(response){
        for(var i=0; i<response.data.length; i++){
            var item={};
            var get=response.data[i];
            item.name=get.name;
            item.revisedate=get.revisedate;
            item.fomat = get.fomat;
            item.size=get.size/(1024);
            temp.push(item);
          }
        }).catch(function(error){
      });
      console.log(temp);
      if(type==1)
        this.fileinfo=temp;
      else
        this.filenameandoper=temp;
      this.getvmdstate(temp);
    },
    getvmdstate(filelist)
    {

    },
    wait()
    {
      this.load=true;
      this.mask();
    },
	  vmd_btn(index){
		  this.isdevice=false;
      this.Idictinfo=[];
      this.vmdinfo={};
      var _this=this;
      this.wait();
      var request_path='Vmd?path='+this.totalpath_req+this.fileinfo[index].name;
      this.$http.get(request_path).then(function(response){
        if(response.data.length==0){
          _this.load=false;
          _this.unmask();
          _this.$Message.error('文件格式不合法或文件还未生成vmd！');
          return ;
        }

        //填写视频文件头
        console.log(response.data);
        console.log('获得vmd啦！！！！！');
        var temp={};
        temp.url=_this.totalpath_req+_this.fileinfo[index].name;
        temp.cluster = response.data.redis;
        temp.Inum = response.data.Icount;
        temp.fps=response.data.fps.toFixed(2)+'fps';
        _this.vmdinfo=temp;

        //填写i帧字典
        temp = [];
        var ilist=response.data.Idict;
        for(var i=0; i<ilist.length; i++)
        {
          var item={};
          item.Inum=ilist[i].Inum;
          item.offset=ilist[i].offset;
          console.log(item);
          temp.push(item);
        }
        _this.Idictinfo = temp;
        _this.load=false;
        _this.isvmd=true;

      }).catch(function(error){
        _this.load=false;
        _this.unmask();
        _this.$Message.error('获取vmd失败！');
      });
	  },
    selectframemod()
    {
      if(this.way=='frameno'){
        this.remid1 = '请输入帧号';
        this.remid2 = '请输入生成的图片(帧)数';
      }else{
        this.remid1 = '请输入起始时间';
        this.remid2 = '请输入结束时间';
      }
    },
    checkframe(){
      var request_path;
      var base_pic_path;
      var _this=this;
      this.wait();
      var num = 0;
      if(this.way=='frameno')
      {
        request_path='Application?path='+this.totalpath_app+this.currentfile+'&type=pic_byno&framebegin='+this.frameno+'&size='+this.framenum;
        num = this.framenum;
      }
      else
      {
        if(this.frameno>this.framenum)
        {
          _this.unmask();
          _this.load=false;
          _this.$Message.error('起始时刻应该小于结束时刻！');
          return ;        
        }
        request_path='Application?path='+this.totalpath_app+this.currentfile+'&type=pic_bytime&timebegin='+this.frameno+'&timeend='+this.framenum;
      }
      this.$http.get(request_path).then(function(response){
        _this.unmask();
        _this.load=false;
        var s=response.data;
        console.log(s);
        if(s[0]=='e'){
          _this.$Message.error('文件格式不合法或文件还未生成vmd！');
          return ;
        }
        else if(_this.way!='frameno')
          num = parseInt(s,10);
        for(var i=0; i<num; i++)
          _this.picture_path_list.push('http://localhost:8080/VideoSystem/img/'+i+'.jpg'+'?param='+Math.random());
      }).catch(function(){
        _this.unmask();
        _this.load=false;
        _this.$Message.error('帧生成失败！');

      });  
    },
    returnapp(){
      this.closeall();
      this.isapp=true;
    }
  }
}
</script>

<style scoped>
.head{
  color:blue;
  padding-left:40px;
  background:;
  overflow: auto;
}
.head-1{
  height : 60px;
  line-height : 60px;
  width:100%;
  background: #999;
  font-weight:bold;
  font-size: 2em;
}
.head-2{
  height : 60px;
  position:absolute;
  left:300px;
  top:60px;
  right:0;
  border-top:2px solid #ccc;
  line-height : 60px;
  font-weight:normal;
  font-size: 1.4em;
}
.tabs{
  height:60px;
  background:;
  text-align:center;
  background:#ccc;
  overflow: auto;
}
.maincontainer{
  position: absolute;
  top: 60px;
  bottom: 0;
  width: 100%;
  overflow: auto;
}
.filetree{
  float: left;
  height: 100%;
  width:20%;
  border-right:1px solid #ccc;
  padding-left: 10px;
  bottom:0;
  overflow:auto;
}
.fileview{
  float: left;
  width: 80%;
  height: 100%;
  overflow:auto;
}
.uploadview{
  text-align: center;
  float: right; 
  height: 7%;
}
.deviceview ,.appview{
  height: 93%;
  overflow: auto;
}
.vmdview
{
  height:400px;
  width: 560px;
}
.pop{
  position: fixed;
  top: 15%;
  left: 0;
  right: 0;       
  margin: auto;
  margin:0 auto;
  background: white;
  -moz-border-radius: 10px;
  -webkit-border-radius: 10px;
  border-radius: 10px;
  z-index: 3;
}
.vmdhead{
  width: 50%;
  height: 100%;
  background: ;
}
.idict{
  position: absolute;
  bottom:35px;
  left: 280px;
  top: 0;
  height: 100%;
  width: 50%;
}
.idictview{
  position:absolute;
  left:0;
  top:60px;
  bottom: 50px;
  width:100%;
  overflow:auto;
  border-left:1px solid #ccc;
  border-bottom: 1px solid #ddd;
}

.vmdheadview
{
  position: absolute;
  width: 50%;
  top: 60px;
  bottom: 50px;
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #ddd;
  overflow: auto;
}
.common{
  height: 60px;
  line-height: 60px;
  font-size:1.2em;
  font-weight: bold;
  color: blue;
  text-align: center;
}
.idictfont{
  width: 100%;
  border-bottom:1px solid #ccc;
}
.picture{
  position:absolute;
  top:88px;
  left:400px;
  right:0px;
  bottom:0;
}
.mask{
  position: absolute;
  width: 100%;
  height: 100%;
  background: #000;
  top: 0;
  left: 0;
  z-index: 2;
  opacity:0.3;
  /*兼容IE8及以下版本浏览器*/
  filter: alpha(opacity=30);
}
.line{
  width: 100%;
  height: 40px;
  border-top:1px #efefef solid;
  border-bottom:1px #fff solid;
}
.line-40{
  height: 40px;
  width: 40%;
  padding-left: 20px;
  line-height: 40px;
  font-size: 1em;
  font-weight: bold;
  display: inline-block;
}
.font-40{
  float: left;
  height: 40px;
  width: 40%;
  line-height: 40px;
  font-size: 1em;
  font-weight: bold;
  text-align: center;
}
.font-60{
  float: left;
  height: 40px;
  width: 60%;
  display: none;
  line-height: 40px;
  font-size: 1em;
  text-align: center;
}
.vmdexit{
  position: absolute;
  left: 95%;
  top: -6%;
}
.demo-spin-icon-load{
    animation: ani-demo-spin 1s linear infinite;
}
@keyframes ani-demo-spin {
    from { transform: rotate(0deg);}
    50%  { transform: rotate(180deg);}
    to   { transform: rotate(360deg);}
}
.demo-spin-col{
    height: 100px;
    position: relative;
    border: 1px solid blue;
}
.load{
  width: 100px;
  height: 100px;
}
.app{
  width: 180px;
  height: 240px;
  background: #666
}
.btn{
  padding-top: 14px;
  text-align:center; 
  height:25%;
  width:100%;
}
.exitbtn{
  position: absolute;
  left: 88%;
  top: -10%;
}
.video_system{
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
}
.content{
  position: absolute;
  left: 0;
  top: 130px;
  bottom: 0;
  right: 0;
}
.ivu-menu{
  z-index: 1;
}
</style>
<style>
.columns_style:{
  height: 100%
}
</style>